window.exports = {};

window.require = function () {
    return {
        webcrypto: window.crypto,
        EasyCrypto: window.exports.EasyCrypto,
        Peer: window.exports.Peer,
    }
};