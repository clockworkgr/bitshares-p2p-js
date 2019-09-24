import Serializer from './Serializer.js';
import {Types, Structures} from './MessageTypes.js';

class Message extends Serializer{

    constructor(message_type) {
        super();
        this._message_type = message_type;
        this.message = {};
        this.structure=Structures[Types[this._message_type]];
    }
    setType(type) {
        this._message_type = type;
    }
    getType() {
        return this._message_type;
    }    
    static fromData(data) {
        let message_type=Buffer.from(data).slice(4, 8).readUInt32LE();        
        let message = new Message(message_type);
        let content = Buffer.from(data).slice(8);
        if (Types[message_type]!=undefined) {
            message.unpack(content,'message');
        }
        return message;
    }
    toJSON() {
        return this.toString();
    }
    toString() {
        return JSON.stringify(this.message, (key, value) =>
            typeof value === 'bigint' ?
            value.toString() :
            value // return everything else unchanged
        )
    }
    pack() {
        super.pack('message');
        let toalloc;
        if (this.buffer.length<8) {
            toalloc=8;
        }else{
            toalloc=this.buffer.length;
        }
        let packed=Buffer.allocUnsafe(8+toalloc).fill(0);
        
        packed.writeUInt32LE(this.buffer.length,0);
        packed.writeUInt32LE(this._message_type,4);
        this.buffer.copy(packed,8,0);
        return packed;

    }
}
export default Message;
