"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const upath = require("upath");
const fse = require("fs-extra");
const PrettyUnits_1 = require("./PrettyUnits");
const Shout_1 = require("./Shout");
function outputFileThenLog(filePath, content) {
    let bundle = Buffer.from(content, 'utf8');
    let info = upath.parse(filePath);
    let size = PrettyUnits_1.prettyBytes(bundle.byteLength);
    Shout_1.Shout.timed(chalk_1.default.blue(info.base), chalk_1.default.magenta(size), chalk_1.default.grey('in ' + info.dir + '/'));
    return fse.outputFile(filePath, bundle);
}
exports.outputFileThenLog = outputFileThenLog;
