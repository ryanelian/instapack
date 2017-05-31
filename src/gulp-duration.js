'use strict';

let pretty = require('pretty-hrtime');
let through = require('through2');
let gutil = require('gulp-util');

module.exports = function (message) {
    let start = process.hrtime();
    let stream = through.obj({
        objectMode: true
    });

    function resetStart() {
        start = process.hrtime();
    }

    stream.start = resetStart;

    return stream.once('end', function () {
        let time = pretty(process.hrtime(start));
        gutil.log(message, gutil.colors.green(time));
    });
};
