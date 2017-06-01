"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const through2 = require("through2");
const vinyl = require("vinyl");
const BufferList = require("bl");
let Buffer = () => {
    return through2.obj(function (chunk, enc, next) {
        let pipe = this;
        if (chunk.isNull()) {
            pipe.push(chunk);
            return next();
        }
        if (chunk.isBuffer()) {
            pipe.push(chunk);
            return next();
        }
        chunk.contents.pipe(BufferList(function (error, data) {
            if (error) {
                return next(error);
            }
            let file = new vinyl({
                path: chunk.path,
                contents: data
            });
            pipe.push(file);
            return next();
        }));
    });
};
exports.Buffer = Buffer;
