import crypto from 'crypto';

class AESUtils {

    constructor(key, iv) {
        this.key = key;
        this.iv = iv;
        this.cipher = crypto.createCipheriv('aes-256-cbc', this.key, this.iv);
        this.decipher = crypto.createDecipheriv('aes-256-cbc', this.key, this.iv);
        this.cipher.setAutoPadding(false);
        this.decipher.setAutoPadding(false);
    }
    encrypt(data) {
        return this.cipher.update(data);
    }
    decrypt(data) {
        return this.decipher.update(data);
    }
}
export default AESUtils;