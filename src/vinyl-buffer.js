'use strict';

let through2 = require('through2').obj;
let vinyl = require('vinyl');
let bl = require('bl');

module.exports = function () {
    return through2(function (chunk, enc, next) {
        let pipe = this;

        if (chunk.isNull()) {
            pipe.push(chunk);
            return next();
        }
        if (chunk.isBuffer()) {
            pipe.push(chunk);
            return next();
        }

        chunk.contents.pipe(bl(function (err, data) {
            if (err) {
                return next(err);
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
