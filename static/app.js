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

        mounted() {
            document.getElementById('app').classList.remove('uninitialized');
            window.onerror = (message, url, line, col) => this.errors.push({ message, url, line, col });
        },

        data() {
            return {
                errors: [],
                mounted: true,
                connected: false,
                ready: false,
                participating: false,
                peers: new Map(),
                messages: [],
                inputs: {
                    name: '',
                    msg: '',
                }
            }
        },

        methods: {
            sendIdentify() {
                peer.name = this.inputs.name;
                if (!peer.name)
                    return;
                peer.emitEncrypted('identify', { name: peer.name });
            },

            sendMsg() {
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
                const now = new Date();
                const then = new Date(msg.t);
                const isSameDay = now.toISOString().substr(0, 10) === then.toISOString().substr(0, 10);
                const formattedDate = isSameDay
                    ? then.toISOString().substr(11, 5)
                    : then.toISOString().substr(0, 10) + ' às ' + then.substr(11, 5);

                msg.n = this.peers.get(msg.u);
                msg.me = msg.u === peer.id;
                msg.tf = formattedDate;
                this.messages.push(msg);
            },

            receiveAllPeers(peers) {
                for (let entry of peers) {
                    this.$addPeer(entry);
                }
            },

            receiveAddPeer(entry) {
                const me = entry.id === peer.id;
                this.$addPeer(entry);
                this.messages.push({ sys: 'add peer', u: entry.id, m: entry.name, me });
            },

            $addPeer(entry) {
                const me = entry.id === peer.id;

                if (me) {
                    this.participating = true;
                }

                this.peers.set(entry.id, {name: entry.name, me});
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

    socket.on('connect_failed', () => app.errors.push({ message: 'Conexão falhou' }));
    socket.on('reconnect_failed', () => app.errors.push({ message: 'Tentativa de reconexão falhou, o servidor deve estar fora do ar.' }));
    socket.on('error', (msg) => app.errors.push({ message: 'Um erro ocorreu: '+msg }));
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