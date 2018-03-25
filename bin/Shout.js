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
function concatenateTokens(...tokens) {
    let message = '';
    for (let i = 0; i < tokens.length; i++) {
        message += ' ' + tokens[i];
    }
    return message;
}
exports.Shout = {
    timed: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = `[${chalk_1.default.grey(nowFormatted())}]${message}`;
        console.log(output);
    },
    error: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = `[${chalk_1.default.red('ERROR')}]${message}`;
        console.log(output);
    },
    fatal: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = `[${chalk_1.default.red('FATAL ERROR')}]${message}`;
        console.log(output);
    },
    danger: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = `[${chalk_1.default.red('DANGER')}]${message}`;
        console.log(output);
    },
    warning: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = `[${chalk_1.default.yellow('WARNING')}]${message}`;
        console.log(output);
    },
};
