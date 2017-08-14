"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const through2 = require("through2");
const chalk = require("chalk");
const GulpLog_1 = require("../GulpLog");
function bigUnitPrefix(unit) {
    switch (unit) {
        case 0: {
            return '';
        }
        case 1: {
            return 'k';
        }
        case 2: {
            return 'M';
        }
        case 3: {
            return 'G';
        }
        case 4: {
            return 'T';
        }
        case 5: {
            return 'P';
        }
        case 6: {
            return 'E';
        }
        case 7: {
            return 'Z';
        }
        case 8: {
            return 'Y';
        }
        default: {
            return '?';
        }
    }
}
function nanoUnitPrefix(unit) {
    switch (unit) {
        case 0: {
            return 'n';
        }
        case 1: {
            return 'µ';
        }
        case 2: {
            return 'm';
        }
        default: {
            return '?';
        }
    }
}
function prettyBytes(size) {
    let unit = 0;
    while (size > 1000) {
        size /= 1000.00;
        unit++;
    }
    return size.toPrecision(3) + ' ' + bigUnitPrefix(unit) + 'B';
}
function prettyTime(hrtime) {
    if (hrtime[0] === 0) {
        let size = hrtime[1];
        let unit = 0;
        while (size > 1000) {
            size /= 1000.00;
            unit++;
        }
        return size.toPrecision(3) + ' ' + nanoUnitPrefix(unit) + 's';
    }
    else {
        let t = hrtime[0] + (hrtime[1] / Math.pow(1000, 3));
        return t.toPrecision(3) + ' s';
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
;
