const fs = require('node:fs');

exports.ServeStatic = function (req, res) {
    if (req.method !== "GET")
        return console.log('Unhandled', req.method, req.url);

    const filename = __dirname + "/static/" + (req.url.replace(/[^a-z.]/, '') || "index.html");

    fs.readFile(filename, function (err, data) {
        if (err) {
            res.writeHead(404);
            res.end("Access deined or file not found");
            return;
        }
        res.writeHead(200);
        res.end(data);
    });
}