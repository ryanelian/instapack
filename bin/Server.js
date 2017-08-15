"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
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
    Update(name, contents) {
        return new Promise((ok, reject) => {
            zlib.gzip(contents, {
                level: 9
            }, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    this.files['/' + name] = result;
                    ok();
                }
            });
        });
    }
}
exports.Server = Server;
