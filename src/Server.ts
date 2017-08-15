import * as http from 'http';
import * as through2 from 'through2';
import * as zlib from 'zlib';

/**
 * Server class for managing and rendering output to HTTP server.
 */
export class Server {
    /**
     * Gets the HTTP Server instance.
     */
    readonly server: http.Server;

    /**
     * Gets the port number where the server is listening.
     */
    readonly port: number;

    /**
     * Gets the map containing filename to a buffer.
     */
    readonly files: { [name: string]: Buffer };

    /**
     * Constructs an HTTP server that listens through a defined port number.
     * @param port 
     */
    constructor(port: number) {
        this.files = {};
        this.port = port;
        this.server = this.Create(port);
    }

    /**
     * Spin a new HTTP server on a localhost port that returns assets based on request URL.
     * @param port 
     */
    Create(port: number) {
        let server = http.createServer((request, response) => {
            let header: any = {};

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

    /**
     * Returns a Promise for storing output buffers as GZip buffers into an internal map.
     */
    Update(name: string, contents: Buffer) {
        return new Promise((ok, reject) => {
            zlib.gzip(contents, {
                level: 9 // maximum compression
            }, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    this.files['/' + name] = result;
                    ok();
                }
            });
        });
    }
}
