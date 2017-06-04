"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prettyTime = require("pretty-hrtime");
const prettyBytes = require("pretty-bytes");
const through2 = require("through2");
const gutil = require("gulp-util");
function BuildLog(label) {
    let start = process.hrtime();
    let stream = through2.obj(function (chunk, enc, next) {
        if (chunk.isBuffer()) {
            let fileName = gutil.colors.blue(chunk.relative);
            let size = gutil.colors.magenta(prettyBytes(chunk.contents.length));
            gutil.log(fileName, size);
        }
        if (chunk.isStream()) {
            gutil.log(gutil.colors.red('Unexpected build artefacts: files are not buffered!'));
        }
        next(null, chunk);
    });
    stream.once('end', () => {
        let time = prettyTime(process.hrtime(start));
        gutil.log('Finished', label, 'after', gutil.colors.green(time));
    });
    return stream;
}
exports.BuildLog = BuildLog;
;
