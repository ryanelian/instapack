"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const through2 = require("through2");
const zlib = require("zlib");
class Server {
    constructor(port) {
        this.files = {};
        this.port = port;
        this.server = this.Create(port);
    }
    Create(port) {
        let server = http.createServer((request, response) => {
            let header = {};
            if (request.url === '/') {
                header['Content-Type'] = 'application/json';
                response.writeHead(200, header);
                response.end(JSON.stringify(Object.keys(this.files)));
                return;
            }
            let content = this.files[request.url];
            if (!content) {
                response.writeHead(404);
                response.end();
                return;
            }
            header['Content-Encoding'] = 'gzip';
            if (request.url.endsWith('.js')) {
                header['Content-Type'] = 'application/javascript';
            }
            if (request.url.endsWith('.css')) {
                header['Content-Type'] = 'text/css';
            }
            response.writeHead(200, header);
            response.end(content);
        });
        server.listen(port);
        return server;
    }
    Update() {
        return through2.obj((chunk, enc, next) => {
            if (chunk.isBuffer()) {
                let key = '/' + chunk.relative;
                zlib.gzip(chunk.contents, {
                    level: 9
                }, (error, result) => {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        this.files[key] = result;
                    }
                });
            }
            next(null, chunk);
        });
    }
}
exports.Server = Server;
