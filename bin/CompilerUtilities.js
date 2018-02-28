"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const upath = require("upath");
const fse = require("fs-extra");
const PrettyUnits_1 = require("./PrettyUnits");
function padZeroToDoubleDigits(x) {
    let s = '';
    if (x < 10) {
        s += '0';
    }
    s += x;
    return s;
}
function nowFormatted() {
    let t = new Date();
    return padZeroToDoubleDigits(t.getHours()) + ':' + padZeroToDoubleDigits(t.getMinutes()) + ':' + padZeroToDoubleDigits(t.getSeconds());
}
function timedLog(...tokens) {
    let output = '[' + chalk_1.default.grey(nowFormatted()) + ']';
    for (let i = 0; i < tokens.length; i++) {
        output += ' ' + tokens[i];
    }
    console.log(output);
}
exports.timedLog = timedLog;
function logAndWriteUtf8FileAsync(filePath, content) {
    let bundle = Buffer.from(content, 'utf8');
    let name = upath.basename(filePath);
    let size = PrettyUnits_1.prettyBytes(bundle.byteLength);
    timedLog(chalk_1.default.blue(name), chalk_1.default.magenta(size));
    return fse.outputFile(filePath, bundle);
}
exports.logAndWriteUtf8FileAsync = logAndWriteUtf8FileAsync;
