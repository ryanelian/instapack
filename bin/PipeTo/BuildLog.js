"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const through2 = require("through2");
const chalk = require("chalk");
const GulpLog_1 = require("../GulpLog");
const bigUnitPrefix = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
const nanoUnitPrefix = ['n', 'µ', 'm'];
function siDegree(x) {
    return Math.floor(Math.log10(x) / 3);
}
function prettyBytes(size) {
    let unit = siDegree(size);
    let scale = size * Math.pow(1000, -unit);
    return scale.toPrecision(3) + ' ' + bigUnitPrefix[unit] + 'B';
}
function prettyTime(hrtime) {
    if (hrtime[0] === 0) {
        let unit = siDegree(hrtime[1]);
        let scale = hrtime[1] * Math.pow(1000, -unit);
        return scale.toPrecision(3) + ' ' + nanoUnitPrefix[unit] + 's';
    }
    else {
        let s = hrtime[0] + (hrtime[1] / Math.pow(1000, 3));
        let h = Math.floor(s / 3600);
        s -= h * 3600;
        let m = Math.floor(s / 60);
        s -= m * 60;
        let result = s.toPrecision(3) + ' s';
        if (m) {
            result = m + ' min ' + result;
        }
        if (h) {
            result = h + ' h ' + result;
        }
        return result;
    }
}
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
