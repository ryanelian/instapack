"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const chalk_1 = require("chalk");
const TypeScript = require("typescript");
function parseTsConfig() {
    let basePath = process.cwd();
    let tsconfigPath = path.join(basePath, 'tsconfig.json');
    try {
        let tsconfigJson = TypeScript.readConfigFile(tsconfigPath, TypeScript.sys.readFile);
        if (tsconfigJson.error) {
            throw Error(tsconfigJson.error.messageText.toString());
        }
        let tsconfig = TypeScript.parseJsonConfigFileContent(tsconfigJson.config, TypeScript.sys, basePath);
        if (tsconfig.errors.length) {
            throw Error(tsconfig.errors[0].messageText.toString());
        }
        return tsconfig;
    }
    catch (error) {
        console.error(chalk_1.default.red('ERROR'), 'Failed to read', chalk_1.default.cyan('tsconfig.json'));
        console.error(error);
        throw error;
    }
}
exports.parseTsConfig = parseTsConfig;
let _options;
function getLazyCompilerOptions() {
    if (_options) {
        return _options;
    }
    _options = parseTsConfig().options;
    _options.moduleResolution = TypeScript.ModuleResolutionKind.NodeJs;
    _options.noEmit = false;
    return _options;
}
exports.getLazyCompilerOptions = getLazyCompilerOptions;
function getTypeScriptTarget() {
    let t = getLazyCompilerOptions().target;
    if (!t) {
        t = TypeScript.ScriptTarget.ES3;
    }
    return TypeScript.ScriptTarget[t];
}
exports.getTypeScriptTarget = getTypeScriptTarget;
function getUglifyESTarget() {
    switch (getTypeScriptTarget()) {
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
        ecma: getUglifyESTarget()
    };
}
exports.createUglifyESOptions = createUglifyESOptions;
