"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shout = void 0;
const chalk = require("chalk");
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
    const t = new Date();
    return padZeroToDoubleDigits(t.getHours()) + ':' + padZeroToDoubleDigits(t.getMinutes()) + ':' + padZeroToDoubleDigits(t.getSeconds());
}
function concatenateTokens(tokens) {
    let message = '';
    for (const token of tokens) {
        if (token instanceof Error) {
            if (token.stack) {
                message += '\n' + chalk.redBright(token.stack);
            }
            else {
                message += '\n' + chalk.redBright(token.toString());
            }
        }
        else {
            message += ' ' + token;
        }
    }
    return message;
}
exports.Shout = {
    timed: function (...tokens) {
        const message = concatenateTokens(tokens);
        const output = `[${chalk.grey(nowFormatted())}]` + message;
        console.log(output);
    },
    error: function (...tokens) {
        const message = concatenateTokens(tokens);
        const output = '\n' + chalk.redBright('ERROR') + message + '\n';
        console.error(output);
    },
    fatal: function (...tokens) {
        const message = concatenateTokens(tokens);
        const output = '\n' + chalk.redBright('FATAL ERROR') + message + '\n';
        console.error(output);
    },
    warning: function (...tokens) {
        const message = concatenateTokens(tokens);
        const output = chalk.yellowBright('WARNING') + message;
        console.warn(output);
    },
    typescript: function (...tokens) {
        const message = concatenateTokens(tokens);
        const output = chalk.blueBright('TypeScript') + message;
        console.log(output);
    },
    sass: function (...tokens) {
        const message = concatenateTokens(tokens);
        const output = chalk.magentaBright('Sass') + message;
        console.log(output);
    },
    fileOutput(filePath, content) {
        const bundle = Buffer.from(content, 'utf8');
        const info = upath.parse(filePath);
        const size = PrettyUnits_1.prettyBytes(bundle.byteLength);
        exports.Shout.timed(chalk.blueBright(info.base), chalk.magentaBright(size), chalk.grey('in ' + info.dir + '/'));
        return fse.outputFile(filePath, bundle);
    }
};
