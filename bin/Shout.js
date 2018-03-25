"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const ErrorFrame_1 = require("./ErrorFrame");
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
function concatenateTokens(tokens) {
    let message = '';
    for (let i = 0; i < tokens.length; i++) {
        message += ' ' + tokens[i];
    }
    return message;
}
exports.Shout = {
    timed: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = `[${chalk_1.default.grey(nowFormatted())}]` + message;
        console.log(output);
    },
    error: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk_1.default.red('ERROR') + message;
        console.error(output);
    },
    fatal: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk_1.default.red('FATAL ERROR') + message;
        console.error(output);
    },
    danger: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk_1.default.red('DANGER') + message;
        console.warn(output);
    },
    warning: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk_1.default.yellow('WARNING') + message;
        console.warn(output);
    },
    typescript: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk_1.default.blue('TypeScript') + message;
        console.log(output);
    },
    sass: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk_1.default.magenta('Sass') + message;
        console.log(output);
    },
    stackTrace: function (error) {
        let render;
        if (error['formatted']) {
            render = chalk_1.default.red(error['formatted']);
        }
        else {
            render = chalk_1.default.bgRed(error.name) + ' ' + error.message;
            for (let frame of ErrorFrame_1.StackFrame.parseErrorStack(error.stack)) {
                render += '\n' + frame.render();
            }
        }
        console.error();
        console.error(render);
        console.error();
    }
};
