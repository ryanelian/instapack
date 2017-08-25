"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const through2 = require("through2");
const vinyl = require("vinyl");
function Vinyl(filename) {
    let pass = true;
    let stream = through2.obj();
    let file = new vinyl({
        path: filename,
        contents: stream
    });
    return through2.obj(function (chunk, enc, next) {
        if (pass) {
            this.push(file);
            pass = false;
        }
        stream.push(chunk);
        next();
    }, function () {
        stream.push(null);
        this.push(null);
    });
}
exports.Vinyl = Vinyl;
