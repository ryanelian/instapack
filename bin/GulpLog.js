"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
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
function GulpLog(...tokens) {
    let output = '[' + chalk_1.default.grey(nowFormatted()) + ']';
    for (let i = 0; i < tokens.length; i++) {
        output += ' ' + tokens[i];
    }
    console.log(output);
}
exports.default = GulpLog;
