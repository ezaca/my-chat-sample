// easy crypto
const easyCryptoMethods = (function () {
    const crypto = require('node:crypto').webcrypto;
    const algorithm = { name: "RSA-OAEP", hash: "SHA-256" };
    const modulusLength = 4096;
    const maxEncryptSize = 446;
    const maxDecryptSize = 512;
    const publicExponent = new Uint8Array([1, 0, 1]);
    const textEncoder = new TextEncoder("utf-8");
    const textDecoder = new TextDecoder("utf-8");

    function generateKeys() {
        return crypto.subtle.generateKey({
            ...algorithm,
            modulusLength,
            publicExponent
        }, true, ["encrypt", "decrypt"]);
    }

    async function encodeKey(key) {
        return new Uint8Array(await crypto.subtle.exportKey("spki", key));
    }

    /**
     * @param {ArrayBuffer} bytes
     */
    function decodeKey(bytes) {
        return crypto.subtle.importKey("spki", new Uint8Array(bytes), algorithm, true, ["encrypt"]);
    }

    async function encrypt(data, key) {
        const promises = [];
        const serialized = serialize(data);
        for (let chk of chunks(serialized, maxEncryptSize)) {
            promises.push(encryptChunk(chk, key));
        }
        const result = await Promise.all(promises);
        const concat = [].concat(...result);
        return new Uint8Array(...concat);
    }

    async function encryptChunk(chunk, key) {
        const result = await crypto.subtle.encrypt(algorithm, key, chunk);
        return new Uint8Array(result);
    }

    async function decrypt(data, key) {
        const promises = [];
        for (let chk of chunks(data, maxDecryptSize)) {
            promises.push(decryptChunk(chk, key));
        }
        const result = await Promise.all(promises);
        const bytes = [].concat(...result);
        return deserialize(new Uint8Array(...bytes));
    }

    function decryptChunk(chunk, key) {
        return crypto.subtle.decrypt(algorithm, key, chunk);
    }

    function serialize(serializable) {
        const str = JSON.stringify(serializable);
        if ((str.length <= 3) && (str !== '[]'))
            console.warn('Serialization returned a short length string ("' + str + '"), which may be due to an error.');
        return textEncoder.encode(str);
    }

    /**
     * @param {ArrayBuffer} bytes
     */
    function deserialize(bytes) {
        const str = textDecoder.decode(new Uint8Array(bytes));
        if ((str.length <= 3) && (str !== '[]'))
            console.warn('Deserialization received a short length string ("'+str+'"), which may be due to an error.');
        return JSON.parse(str);
    }

    /**
     * @param {ArrayBuffer} buffer
     * @param {number} size
     * @returns {Uint8Array[]}
     */
    function chunks(buffer, size) {
        const bytes = new Uint8Array(buffer);
        const result = [];
        for (let i = 0; i < bytes.length; i+= size) {
            result.push(bytes.slice(i, i + size));
        }
        return result;
    }

    return {
        generateKeys,
        encodeKey,
        decodeKey,
        encrypt,
        decrypt,
    }
})();

class EasyCrypto {
    /**
     * @returns {Promise<CryptoKeyPair>}
     */
    generateKeys() {
        return easyCryptoMethods.generateKeys();
    }

    /**
     * @param {CryptoKey} key
     * @returns {Promise<Uint8Array>}
     */
    encodeKey(key) {
        return easyCryptoMethods.encodeKey(key);
    }

    /**
     * @param {ArrayBuffer|number[]} bytes
     * @returns {Promise<CryptoKey>}
     */
    decodeKey(bytes) {
        return easyCryptoMethods.decodeKey(bytes);
    }

    /**
     * @param {any} data
     * @param {CryptoKey} key
     * @returns {Promise<Uint8Array>}
     */
    encrypt(data, key) {
        return easyCryptoMethods.encrypt(data, key);
    }

    /**
     * @param {ArrayBuffer|number[]} bytes
     * @param {CryptoKey} key
     * @returns {Promise<any>}
     */
    decrypt(bytes, key) {
        return easyCryptoMethods.decrypt(bytes, key);
    }
}

EasyCrypto.singleton = new EasyCrypto();

exports.EasyCrypto = EasyCrypto;