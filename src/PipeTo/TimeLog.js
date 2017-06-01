"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prettyTime = require("pretty-hrtime");
const through2 = require("through2");
const gutil = require("gulp-util");
let TimeLog = message => {
    let start = process.hrtime();
    let stream = through2.obj();
    return stream.once('end', () => {
        let time = prettyTime(process.hrtime(start));
        gutil.log(message, gutil.colors.green(time));
    });
};
exports.TimeLog = TimeLog;
