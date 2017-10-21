"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const through2 = require("through2");
const chalk_1 = require("chalk");
const GulpLog_1 = require("../GulpLog");
const PrettyUnits_1 = require("../PrettyUnits");
function BuildLog(label) {
    let start = process.hrtime();
    let stream = through2.obj(function (chunk, enc, next) {
        if (chunk.isStream()) {
            let error = new Error('BuildLog: Streaming is not supported!');
            return next(error);
        }
        if (chunk.isBuffer()) {
            let size = PrettyUnits_1.prettyBytes(chunk.contents.length);
            GulpLog_1.default(chalk_1.default.blue(chunk.relative), chalk_1.default.magenta(size));
        }
        next(null, chunk);
    });
    stream.once('end', () => {
        let time = PrettyUnits_1.prettyHrTime(process.hrtime(start));
        GulpLog_1.default('Finished', label, 'after', chalk_1.default.green(time));
    });
    return stream;
}
exports.BuildLog = BuildLog;
