"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const through2 = require("through2");
function VinylBuffer() {
    return through2.obj(function (chunk, enc, next) {
        if (!chunk.isStream()) {
            next(null, chunk);
            return;
        }
        let buffers = [];
        chunk.contents.on('data', (data) => {
            buffers.push(data);
        });
        chunk.contents.on('error', (error) => {
            next(error);
        });
        chunk.contents.on('end', () => {
            chunk.contents = Buffer.concat(buffers);
            next(null, chunk);
        });
    });
}
exports.VinylBuffer = VinylBuffer;
