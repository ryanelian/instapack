"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
class PrettyObject {
    constructor(symbolColor = 'red', ordinalColor = 'green', stringColor = 'whiteBright', nullColor = 'gray') {
        this.symbolChalk = chalk_1.default[symbolColor];
        this.ordinalChalk = chalk_1.default[ordinalColor];
        this.stringChalk = chalk_1.default[stringColor];
        this.nullChalk = chalk_1.default[nullColor];
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
let p = new PrettyObject();
exports.default = p;
