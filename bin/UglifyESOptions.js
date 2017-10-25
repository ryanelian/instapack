"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fse = require("fs-extra");
const path = require("path");
function getUserTsconfigPath() {
    return path.join(process.cwd(), 'tsconfig.json');
}
let _tsconfigTarget;
function tryGetTypeScriptTarget() {
    try {
        if (_tsconfigTarget) {
            return _tsconfigTarget;
        }
        let tsconfig = fse.readJSONSync(getUserTsconfigPath());
        _tsconfigTarget = tsconfig.compilerOptions.target;
        _tsconfigTarget = _tsconfigTarget.toUpperCase();
        return _tsconfigTarget;
    }
    catch (_a) {
        return 'ES5';
    }
}
exports.tryGetTypeScriptTarget = tryGetTypeScriptTarget;
function getUglifyESTarget() {
    switch (tryGetTypeScriptTarget()) {
        case 'ES5': {
            return 5;
        }
        case 'ES2015': {
            return 6;
        }
        case 'ES2016': {
            return 7;
        }
        case 'ES2017': {
            return 8;
        }
        default: {
            return undefined;
        }
    }
}
function createUglifyESOptions() {
    return {
        ecma: getUglifyESTarget(),
        sourceMap: undefined
    };
}
exports.createUglifyESOptions = createUglifyESOptions;
