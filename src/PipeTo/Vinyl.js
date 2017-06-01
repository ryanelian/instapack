"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const through2 = require("through2");
const vinyl = require("vinyl");
let Vinyl = filename => {
    let pass = true;
    let buffer = through2.obj();
    let file = new vinyl({
        path: filename,
        contents: buffer
    });
    return through2.obj(function (chunk, enc, next) {
        if (pass) {
            this.push(file);
            pass = false;
        }
        buffer.push(chunk);
        next();
    }, function () {
        buffer.push(null);
        this.push(null);
    });
};
exports.Vinyl = Vinyl;
