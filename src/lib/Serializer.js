import varint from 'varint';

class Serializer {
    constructor() {

    }
    unpack(data, structure_name) {
        this[structure_name] = {};
        for (let field of this.structure) {
            let unpacked = this.unpackField(data, field[1]);
            this[structure_name][field[0]] = unpacked[0];
            data = unpacked[1];
        }
    }
    pack(structure_name) {
        this.buffer = Buffer.allocUnsafe(0);
        for (let field of this.structure) {
            
            this.packField(this[structure_name][field[0]], field[1]);
        }
    }
    append(b) {
        this.buffer = Buffer.concat([this.buffer, b]);
    }
    packField(value, field_type) {

        switch (field_type) {

            case 'address_info_array': {
                let len = value.length;
                if (len!=0) {
                this.append(Buffer.from(varint.encode(len)));
                }
            } 
            break;
        case 'string': {
            let buf = Buffer.from(value, 'ascii');
            let len = Buffer.allocUnsafe(1);
            len.writeUInt8(buf.length);
            this.append(len);
            this.append(buf);
        }
        break;
        case 'uint8': {
            let buf = Buffer.allocUnsafe(1);
            buf.writeUInt8(value);

            this.append(buf);
        }
        break;
        case 'uint16': {
            let buf = Buffer.allocUnsafe(2);
            buf.writeUInt16LE(value);
            this.append(buf);
        }
        break;
        case 'uint32': {
            let buf = Buffer.allocUnsafe(4);
            buf.writeUInt32LE(value);
            this.append(buf);
        }
        break;
        case 'uint64': {
            let buf = Buffer.allocUnsafe(8);
            buf.writeBigUInt64LE(value);
            this.append(buf);
        }
        break;
        case 'ipaddress': {
            let buf = Buffer.allocUnsafe(4);
            let ip = value.split('.');
            buf.writeUInt8(ip[3], 0);
            buf.writeUInt8(ip[2], 1);
            buf.writeUInt8(ip[1], 2);
            buf.writeUInt8(ip[0], 3);
            this.append(buf);
        }
        break;
        case 'publickey': {
            this.append(Buffer.from(value, 'hex', 33));
        }
        break;
        case 'signature': {
            this.append(Buffer.from(value, 'hex', 65));
        }
        break;
        case 'sha256': {
            this.append(Buffer.from(value, 'hex', 32));
        }
        break;
        case 'variant_object': {
            let keys = Object.keys(value);
            let len = keys.length;
            this.append(Buffer.from(varint.encode(len)));
            for (let i = 0; i < len; i++) {
                this.packField(keys[i], 'string');

                if (typeof value[keys[i]] == 'bigint') {
                    this.packField(2, 'uint8');
                    this.packField(value[keys[i]], 'uint64');
                } else {
                    this.packField(5, 'uint8');
                    this.packField(value[keys[i]], 'string');
                }

            }
        }
        break;
        }
    }
    unpackField(data, field_type) {
        let result = [];
        switch (field_type) {
            case 'string':
                result[0] = data.toString('ascii', 1, data.readUInt8(0) + 1);
                result[1] = data.slice(data.readUInt8(0) + 1);
                break;
            case 'address_info_array': {
                let entries = varint.decode(data, 0);
                
                let data_start = varint.decode.bytes;
                data = data.slice(data_start);
                let vector = [];
                for (let i = 1; i <= entries; i++) {
                    let address = this.unpackField(data, 'address_info');

                    vector.push(address[0]);
                    data = address[1];
                }
                result[0] = vector;
                result[1] = data;
            }
            break;
        case 'address_info': {
            let addr={};
            
            let ip = this.unpackField(data, 'ipaddress');
            data = ip[1];
            let port = this.unpackField(data, 'uint16');
            data = port[1];
            addr.remote_endpoint = ip[0] + ':' + port[0];
            let last_seen = this.unpackField(data, 'uint32');
            addr.last_seen_time = last_seen[0];
            data = last_seen[1];
            let latency = this.unpackField(data, 'uint64');
            addr.latency = latency[0];
            data = latency[1];

            let node_id = this.unpackField(data, 'publickey');
            addr.node_id = node_id[0];
            data = node_id[1];
            let direction = this.unpackField(data, 'uint8');
            addr.direction = direction[0];
            data = direction[1];
            let firewalled = this.unpackField(data, 'uint8');
            addr.firewalled = firewalled[0];
            data = firewalled[1];

            result[0] = addr;
            result[1] = data;
        }
        break;

        case 'uint8':
            result[0] = data.readUInt8(0);
            result[1] = data.slice(1);
            break;
        case 'uint16':
            result[0] = data.readUInt16LE(0);
            result[1] = data.slice(2);
            break;
        case 'uint32':
            result[0] = data.readUInt32LE(0);
            result[1] = data.slice(4);
            break;
        case 'uint64':
            result[0] = data.readBigUInt64LE(0);
            result[1] = data.slice(8);
            break;
        case 'ipaddress':
            result[0] = data.readUInt8(3) + '.' + data.readUInt8(2) + '.' + data.readUInt8(1) + '.' + data.readUInt8(0);
            result[1] = data.slice(4);
            break;
        case 'publickey':
            result[0] = data.toString('hex', 0, 33);
            result[1] = data.slice(33);
            break;
        case 'signature':
            result[0] = data.toString('hex', 0, 65);
            result[1] = data.slice(65);
            break;
        case 'sha256':
            result[0] = data.toString('hex', 0, 32);
            result[1] = data.slice(32);
            break;
        case 'variant_object': {
            let entries = varint.decode(data, 0);

            let data_start = varint.decode.bytes;
            data = data.slice(data_start);
            let variant = {};
            for (let i = 1; i <= entries; i++) {

                let unpackedkey = this.unpackField(data, "string");
                let key = unpackedkey[0];


                data = unpackedkey[1];

                let value_type = data.readUInt8(0);

                data = data.slice(1);
                let value;
                switch (value_type) {
                    case 5: {
                        let unpackedval = this.unpackField(data, "string");
                        value = unpackedval[0];
                        data = unpackedval[1];
                    }
                    break;
                case 2: {
                    let unpackedval = this.unpackField(data, "uint64");
                    value = unpackedval[0];
                    data = unpackedval[1];
                }
                break;
                }
                variant[key] = value;
            }
            result[0] = variant;
            result[1] = data;
        }
        break;
        }
        return result;
    }
}
export default Serializer;