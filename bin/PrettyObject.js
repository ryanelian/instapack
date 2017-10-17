"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
class PrettyObject {
    constructor(symbolColor = 'red', ordinalColor = 'green', stringColor = 'whiteBright', nullColor = 'gray') {
        this.symbolChalk = chalk[symbolColor];
        this.ordinalChalk = chalk[ordinalColor];
        this.stringChalk = chalk[stringColor];
        this.nullChalk = chalk[nullColor];
    }
    isObject(o) {
        return (o !== null) && (o !== undefined) && (typeof o === 'object');
    }
    isFunction(o) {
        return (typeof o === 'function');
    }
    getPropertySpacer(o) {
        if (this.isObject(o)) {
            if (Object.keys(o).length === 0)
                return '';
            return '\n';
        }
        else {
            return ' ';
        }
    }
    getLevelSpacer(level) {
        let s = '';
        for (let i = 0; i < level; i++) {
            s += '  ';
        }
        return s;
    }
    isSassError(o) {
        return (o instanceof Error) && o.message && o['column'] && o['file'] && o['line'] && o['formatted'];
    }
    render(o, level = 0) {
        if (o === undefined) {
            return this.nullChalk('undefined');
        }
        else if (o === null) {
            return this.nullChalk('null');
        }
        else if (typeof o === 'string') {
            return this.stringChalk(o);
        }
        else if (Array.isArray(o)) {
            let result = [];
            for (let e of o) {
                if (this.isFunction(e)) {
                    continue;
                }
                let line = '';
                line += this.getLevelSpacer(level);
                line += this.symbolChalk('-');
                line += this.getPropertySpacer(e);
                line += this.render(e, level + 1);
                result.push(line);
            }
            return result.join('\n');
        }
        else if (typeof o === 'object') {
            if (this.isSassError(o)) {
                return chalk.red(o['formatted']);
            }
            let result = [];
            for (let key of Object.keys(o).sort()) {
                if (this.isFunction(o[key])) {
                    continue;
                }
                let line = '';
                line += this.getLevelSpacer(level);
                line += this.symbolChalk(key + ':');
                line += this.getPropertySpacer(o[key]);
                line += this.render(o[key], level + 1);
                result.push(line);
            }
            return result.join('\n');
        }
        else if (typeof (o) === 'number' || typeof (o) === 'boolean') {
            return this.ordinalChalk(o.toString());
        }
        else {
            return '';
        }
    }
}
exports.PrettyObject = PrettyObject;
