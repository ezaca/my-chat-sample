const { Peer } = require("./static/shared/peer");

class Broadcaster{
	constructor()
	{
		/**
		 * @type {Peer[]}
		 */
		this.peers = [];
	}

	/**
	 * @param {Peer} peer
	 */
	addPeer(peer){
		this.peers.push(peer);
	}

	/**
	 * @param {Peer} peer
	 */
	removePeer(peer){
		const index = this.peers.indexOf(peer);
		if (index < 0) return;
		this.peers.splice(index, 1);
	}

	/**
	 * @returns {Peer[]}
	 */
	get readyPeers(){
		return this.peers.filter(peer => peer.encryptReady());
	}

	getPeersInfo(){
		return this.readyPeers.map(peer => peer.summary());
	}

	/**
	 * @param {string} message
	 * @param {any} data
	 */
	broadcastPlain(message, data){
		for (let peer of this.readyPeers)
		{
			peer.emitPlain(message, data);
		}
	}

	/**
	 * @param {string} message
	 * @param {any} data
	 */
	async broadcastEncrypted(message, data){
		const promises = [];
		for (let peer of this.readyPeers){
			promises.push(peer.emitEncrypted(message, data));
		}
		return await Promise.all(promises);
	}
}

exports.Broadcaster = Broadcaster;