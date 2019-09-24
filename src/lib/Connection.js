import {
    EventEmitter
} from 'events';
import net from 'net';
import crypto from 'crypto';
import cm from '../citymurmur';
import Message from './Message.js';
import {
    PrivateKey,
    Signature
} from "bitsharesjs";
import {
    v4 as uuid
} from 'uuid';
import config from '../config.js';
import AESUtils from './AESUtils.js';

class Connection extends EventEmitter {

    constructor(ip, port) {
        super();
        this.chain_id = config.chain_id;
        this.node_id = config.node_id;
        this.private_key = config.private_key;
        this.public_key = config.public_key;
        this.ecdh = crypto.createECDH('secp256k1');
        this.conn_keys = this.ecdh.generateKeys();
        this.conn_pub_key = this.ecdh.getPublicKey(null, 'compressed');
        this.uuid = uuid();
        this.ip = ip;
        this.port = port;
        this.first = true;
        this.state = 'init';
        this.hash = crypto.createHash('sha512');
        this.keyhash = crypto.createHash('sha256');
    }

    connect() {
        this.socket = net.createConnection(this.port, this.ip);
        this.state = 'connecting';
        this.emit('status', 'connecting');
        this.socket.on('data', (data) => {
            this.receiveMessage(data);
        }).on('connect', () => {
            this.connected();
        }).on('end', () => {
            this.close;
        });
        this.socket.setKeepAlive(true, 1000);
    }
    close() {
        this.emit('status', 'closed');
        this.state = 'closed';
    }
    connected() {
        this.emit('status', 'connected');
        this.state = 'connected';
        this.socket.write(this.conn_pub_key);
    }
    sendHello() {
        let hello = new Message(5006);
        hello.message = {
            user_agent: 'BitShares p2p.js Implementation',
            core_protocol_version: 106,
            inbound_address: '10.0.1.121',
            inbound_port: 1776,
            outbound_port: 1776,
            node_public_key: this.public_key,
            signed_shared_secret: this.signed_secret,
            chain_id: this.chain_id,
            user_data: {
                fc_git_revision_sha: '91d8772b7b09819b59893d645d01fe181923693d',
                fc_git_revision_unix_timestamp: BigInt(1565722938),
                platform: 'javascript',
                bitness: BigInt(64),
                node_id: this.node_id,
                last_known_block_hash: '0000000000000000000000000000000000000000',
                last_known_block_number: BigInt(0),
                last_known_block_time: '1970-01-01'
            }
        };
        let packed = hello.pack();
        let tosend = this.aes.encrypt(packed);
        this.padAndSend(tosend);
        this.emit('message-sent', hello._message_type);
    }
    padAndSend(data) {
        let padding = data.length % 16;
        if (padding > 0) {
            data = Buffer.concat([data, Buffer.allocUnsafe(16 - padding).fill(0)]);
            this.socket.write(data);
        } else {
            this.socket.write(data);
        }
    }
    receiveMessage(data) {

        this.socket.pause();
        if (this.state == 'authenticated' || this.state=='handshaking') {
            let received = this.aes.decrypt(data);
            let message = Message.fromData(received);

            this.emit('message-received', message._message_type);
            if (message._message_type == 5006) {
                let sig = Signature.fromBuffer(Buffer.from(message.message.signed_shared_secret, 'hex'));

                if (sig.recoverPublicKeyFromBuffer(this.decoder).toHex() != message.message.node_public_key) {
                    this.socket.destroy();
                } else {
                    let accept = new Message(5007);
                    let packed = accept.pack();
                    let msg = this.aes.encrypt(packed);
                    this.padAndSend(msg);
                    this.emit('message-sent', accept._message_type);
                }
            }
            if (message._message_type == 5007) {
                let address_req = new Message(5009);
                let packed = address_req.pack();
                let msg = this.aes.encrypt(packed);
                this.padAndSend(msg);
                this.state='authenticated';
                this.emit('status','authenticated');
                this.emit('message-sent', address_req._message_type);
            }
            if (message._message_type == 5009) {
                let address_resp = new Message(5010);
                address_resp.message._vector = [];
                let packed = address_resp.pack();
                let msg = this.aes.encrypt(packed);
                this.padAndSend(msg);
                this.emit('message-sent', address_resp._message_type);
            }
        } else {
            this.state='handshaking';
            this.secret = this.ecdh.computeSecret(data);
            this.hash.update(this.secret);
            this.decoder = this.hash.digest();
            let key = this.keyhash.update(this.decoder).digest();
            let iv = cm.cityMurmur(this.decoder);
            this.aes = new AESUtils(key, iv);
            this.signed_secret = Signature.signBuffer(this.decoder, PrivateKey.fromBuffer(Buffer.from(this.private_key, 'hex'))).toBuffer().toString('hex');
            this.sendHello();
        }
        this.socket.resume();
    }
}
export default Connection;