(async function ()
{
    const { Peer } = require('./shared/peer');
    const { EasyCrypto } = require('./shared/easycrypto');

    /**
     * @type {Peer}
     */
    let peer = null;
    let socket = null;
   
    const app = Vue.createApp({

        data() {
            return {
                connected: false,
                ready: false,
                peers: new Map(),
                messages: [],
                inputs: {
                    name: 'Anonimo',
                    msg: '',
                }
            }
        },

        methods: {
            sendIdentify()
            {
                peer.name = this.inputs.name;
                if (!peer.name)
                    return;
                peer.emitEncrypted('identify', { name: peer.name });
            },

            sendMsg()
            {
                if (!this.inputs.msg)
                    return;
                peer.emitEncrypted('msg', { m: '' + this.inputs.msg });
                this.inputs.msg = '';
            },

            receiveStart() {
                peer.id = socket.id;
                app.connected = true;
                peer.emitKey('ready', peer.getMyPublicKey());
            },

            receiveReady(key) {
                peer.setTheirPublicKey(key);
                this.ready = true;
            },

            receiveMsg(msg) {
                msg.n = this.peers.get(msg.u);
                msg.me = msg.u === peer.id;
                this.messages.push(msg);
            },

            receiveAllPeers(peers) {
                for (let entry of peers) {
                    this.peers.set(entry.id, entry.name);
                }
            },

            receiveAddPeer(entry) {
                const me = entry.id === peer.id;
                this.peers.set(entry.id, entry.name);
                this.messages.push({ sys: 'add peer', u: entry.id, m: entry.name, me });
            },

            receiveRemovePeer(id) {
                const me = entry.id === peer.id;
                this.peers.delete(id);
                this.messages.push({ sys: 'remove peer', u: entry.id, m: entry.name, me });
            },
        }

    }).mount('#app');

    const keys = await EasyCrypto.singleton.generateKeys();
    socket = io();
    peer = new Peer(socket);
    peer.initialize(keys);

    peer.onReceivePlain('disconnect', () => app.connected = false);
    peer.onReceivePlain('start', () => app.receiveStart());
    peer.onReceiveKey('ready', key => app.receiveReady(key));
    peer.onReceiveEncrypted('all peers', peers => app.receiveAllPeers(peers));
    peer.onReceiveEncrypted('add peer', peer => app.receiveAddPeer(peer));
    peer.onReceiveEncrypted('remove peer', id => app.receiveAllPeers(id));
    peer.onReceiveEncrypted('msg', data => app.receiveMsg(data));
    console.log("Application startup ready.");

    /*Debug*/window.app = app;
})();