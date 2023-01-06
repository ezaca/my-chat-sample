const fs = require('node:fs');

exports.ServeStatic = function (req, res) {
    if ((req.method !== "GET") && (req.method !== "OPTIONS"))
        return console.log('Unhandled', req.method, req.url);

    const filename = __dirname + "/static/" + (req.url.replace(/[^a-z.]/, '') || "index.html");

    fs.readFile(filename, function (err, data) {
        if (err) {
            res.writeHead(404);
            res.end("Access deined or file not found");
            return;
        }
        let contentType = 'text/html';
        if (filename.endsWith('.css'))
            contentType = 'text/css';
        else if (filename.endsWith('.js'))
            contentType = 'text/javascript';
        else if (filename.endsWith('.ico'))
            contentType = 'image/x-icon';
        else if (filename.endsWith('.png'))
            contentType = 'image/png';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}