const { Peer } = require("./static/shared/peer");
const { Broadcaster } = require("./Broadcaster");

function after(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.HandleSocket = function (io, serverKeys) {
    const broadcaster = new Broadcaster();

    // Recebe a conexão de um novo cliente.
    io.on('connection', function (socket) {
        const peer = new Peer(socket);
        broadcaster.addPeer(peer);
        peer.initialize({ privateKey: serverKeys.privateKey });
        after(100).then(() => peer.emitPlain('start', {}));

        // Recebe a informação de que o cliente está desconectado e avisa a
        // todos os pares.
        peer.onReceivePlain('disconnect', () => {
            broadcaster.removePeer(peer);
            broadcaster.broadcastEncrypted('remove peer', peer.id);
        });

        // TODO: reconnect?

        // Recebe a chave do cliente e envia sua própria chave para iniciar a
        // comunicação criptográfica.
        peer.onReceiveKey('ready', key => {
            peer.setTheirPublicKey(key);
            peer.emitKey('ready', serverKeys.publicKey);
        });

        // Recebe a identificação do cliente para que se inicie a presença no
        // chat do grupo.
        peer.onReceiveEncrypted('identify', async data => {
            try {
                peer.name = data.name;
                await peer.emitEncrypted('all peers', broadcaster.getPeersInfo());
                await broadcaster.broadcastEncrypted('add peer', peer.summary());
            } catch (e) {
                console.error('On "identify" could not send all peers and/or add peer');
                console.error(e);
            }
        });

        // Recebe mensagem de chat e envia a todos do grupo.
        peer.onReceiveEncrypted('msg', async received => {
            try {
                const msg = {
                    m: '' + received.m,
                    u: peer.id,
                    t: Date.now(),
                };
                await broadcaster.broadcastEncrypted('msg', msg);
            } catch (e) {
                console.error('On "msg" could not send message to some peers');
                console.error(e);
            }
        });
    });
}