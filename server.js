console.log("Application loaded...");
const http = require('http');
const socketIo = require('socket.io');
const { HandleSocket } = require("./HandleSocket");
const { EasyCrypto } = require("./static/shared/EasyCrypto");
const ServeStatic = require('./ServeStatic').ServeStatic;
const port = process.env.PORT || 8080;

const httpServer = http.createServer(function (req, res) {
    ServeStatic(req, res);
});

(async function () {
    console.log("Generating keys...");
    const serverKeys = await EasyCrypto.singleton.generateKeys();

    console.log("Starting server and socket...");
    httpServer.listen(port);

    const io = new socketIo.Server(httpServer, { /* options */ });
    HandleSocket(io, serverKeys);

    console.log("Application ready");
    console.log("Listening on", "http://localhost:"+port);
    console.log("");
})();

console.log("Application main script finished...");