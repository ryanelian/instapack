"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const chalk_1 = require("chalk");
const TypeScript = require("typescript");
let tsCompilerOptions;
function tryGetTsConfigCompilerOptions() {
    if (tsCompilerOptions) {
        return tsCompilerOptions;
    }
    let basePath = process.cwd();
    let tsconfigPath = path.join(basePath, 'tsconfig.json');
    tsCompilerOptions = TypeScript.getDefaultCompilerOptions();
    try {
        let tsconfigJson = TypeScript.readConfigFile(tsconfigPath, TypeScript.sys.readFile);
        if (tsconfigJson.error) {
            throw Error(tsconfigJson.error.messageText.toString());
        }
        let tsconfig = TypeScript.parseJsonConfigFileContent(tsconfigJson.config, TypeScript.sys, basePath);
        if (tsconfig.errors.length) {
            throw Error(tsconfig.errors[0].messageText.toString());
        }
        tsCompilerOptions = tsconfig.options;
    }
    catch (error) {
        console.error(chalk_1.default.red('ERROR'), 'Failed to read', chalk_1.default.cyan('tsconfig.json'), chalk_1.default.grey('(Fallback to default compiler options!)'));
        console.error(error);
    }
    tsCompilerOptions.moduleResolution = TypeScript.ModuleResolutionKind.NodeJs;
    tsCompilerOptions.noEmit = false;
    return tsCompilerOptions;
}
exports.tryGetTsConfigCompilerOptions = tryGetTsConfigCompilerOptions;
function tryGetTypeScriptTarget() {
    let t = tryGetTsConfigCompilerOptions().target;
    if (!t) {
        t = TypeScript.ScriptTarget.ES3;
    }
    return TypeScript.ScriptTarget[t];
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
        ecma: getUglifyESTarget()
    };
}
exports.createUglifyESOptions = createUglifyESOptions;
