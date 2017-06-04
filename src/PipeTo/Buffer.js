"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const through2 = require("through2");
const BufferList = require("bl");
function Buffer() {
    return through2.obj(function (chunk, enc, next) {
        if (!chunk.isStream()) {
            next(null, chunk);
            return;
        }
        chunk.contents.pipe(BufferList(function (error, data) {
            if (error) {
                return next(error);
            }
            chunk.contents = data;
            next(null, chunk);
        }));
    });
}
exports.Buffer = Buffer;
;
