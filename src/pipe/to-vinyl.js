'use strict';

let through2 = require('through2').obj;
let vinyl = require('vinyl');

module.exports = function (filename) {
    let pass = true;
    let buffer = through2();
    let file = new vinyl({
        path: filename,
        contents: buffer
    });

    return through2(function (chunk, enc, next) {
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
