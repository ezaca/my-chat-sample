
class Peer {
    constructor(socket) {
        const { EasyCrypto } = require("./easycrypto");
        this.id = socket.id;
        this.name = null;
        this.crypto = EasyCrypto.singleton;
        this.socket = socket;
        this.encryptKey = null;
        this.decryptKey = null;
        this.peerPublicKey = null;
    }

    summary(){
        return {
            id: this.id,
            name: this.name,
        };
    }

    encryptReady() {
        return !!(this.encryptKey && this.decryptKey && this.name);
    }

    /**
     * @param {CryptoKeyPair} keys
     */
    initialize(keys = {}) {
        this.peerPublicKey = keys.publicKey ?? null;
        this.decryptKey = keys.privateKey ?? null;
    }

    getMyPublicKey() {
        return this.peerPublicKey;
    }

    /**
     * @param {CryptoKey} key
     */
    setTheirPublicKey(key) {
        this.encryptKey = key;
    }

    /**
     * @param {string} message
     * @param {any} data
     */
    emitPlain(message, data) {
        this.socket.emit(message, data);
    }

    /**
     * @param {string} message
     * @param {CryptoKey} key
     */
    async emitKey(message, key) {
        const data = await this.crypto.encodeKey(key);
        this.socket.emit(message, data);
    }

    /**
     * @param {string} message
     * @param {any} data
     */
    async emitEncrypted(message, data) {
        if (!this.encryptKey)
            return console.error("Encryption key is not set yet");
        /*Debug*/console.log('emitEncrypted', message);
        const cipher = await this.crypto.encrypt(data, this.encryptKey);
        this.socket.emit(message, cipher);
    }

    /**
     * @param {string} message
     * @param {Function} callback A function that receives (data, peer).
     */
    onReceivePlain(message, callback) {
        this.socket.on(message, data => callback(data, this));
    }

    /**
     * @param {string} message
     * @param {Function} callback A function that receives (key, peer).
     */
    onReceiveKey(message, callback) {
        this.socket.on(message, async (bytes) => {
            try
            {
                const key = await this.crypto.decodeKey(bytes);
                callback(key, this);
            } catch (e) {
                console.error("Could not decode the received key:", message);
                console.error(e);
            }
        });
    }

    /**
     * @param {string} message
     * @param {Function} callback A function that receives (decryptedData, peer).
     */
    onReceiveEncrypted(message, callback) {
        this.socket.on(message, async (bytes) => {
            if (!this.decryptKey)
                return console.error("Decryption key is not set yet");
            /*Debug*/console.log('onReceiveEncrypted', message);
            try
            {
                const data = await this.crypto.decrypt(bytes, this.decryptKey);
                callback(data, this);
            } catch (e) {
                console.error('Could not decrypt received content:', message);
                console.error(e);
            }
        });
    }
}

exports.Peer = Peer;