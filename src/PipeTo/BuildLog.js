"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prettyTime = require("pretty-hrtime");
const prettyBytes = require("pretty-bytes");
const through2 = require("through2");
const chalk = require("chalk");
const GulpLog_1 = require("../GulpLog");
function BuildLog(label) {
    let start = process.hrtime();
    let stream = through2.obj(function (chunk, enc, next) {
        if (chunk.isStream()) {
            let error = new Error('BuildLog: Streaming is not supported!');
            return next(error);
        }
        if (chunk.isBuffer()) {
            let fileName = chalk.blue(chunk.relative);
            let size = chalk.magenta(prettyBytes(chunk.contents.length));
            GulpLog_1.default(fileName, size);
        }
        next(null, chunk);
    });
    stream.once('end', () => {
        let time = prettyTime(process.hrtime(start));
        GulpLog_1.default('Finished', label, 'after', chalk.green(time));
    });
    return stream;
}
exports.BuildLog = BuildLog;
;
