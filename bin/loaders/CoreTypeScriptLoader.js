"use strict";
const TypeScript = require("typescript");
const loader_utils_1 = require("loader-utils");
const chalk_1 = require("chalk");
const LevelCheck_1 = require("../LevelCheck");
const upath = require("upath");
module.exports = function (source) {
    let options = loader_utils_1.getOptions(this);
    if (!options.compilerOptions) {
        this.emitError(new Error('TypeScript compiler options was not provided to Core TypeScript Loader!'));
        return;
    }
    if (this.resourcePath.endsWith('.js') || this.resourcePath.endsWith('.mjs')) {
        let target = options.compilerOptions.target || TypeScript.ScriptTarget.ES5;
        if (target === TypeScript.ScriptTarget.ESNext) {
            this.callback(null, source);
            return;
        }
        let parse = LevelCheck_1.checkLevel(this.resourcePath, source, target);
        if (parse.level <= target) {
            this.callback(null, source);
            return;
        }
        let levelName = TypeScript.ScriptTarget[parse.level].toUpperCase();
        let rel = '/' + upath.relative(this.rootContext, this.resourcePath);
        console.log(`${chalk_1.default.yellow('LibGuard')}: ${chalk_1.default.red(levelName)} detected! ${chalk_1.default.cyan(rel)}`);
        this.callback(null, source);
        return;
    }
    let result = TypeScript.transpileModule(source, {
        compilerOptions: options.compilerOptions,
        fileName: this.resourcePath
    });
    if (result.diagnostics && result.diagnostics[0]) {
        let error = Error(result.diagnostics[0].messageText.toString());
        this.callback(error);
        return;
    }
    if (this.sourceMap && result.sourceMapText) {
        let sm = JSON.parse(result.sourceMapText);
        sm.sources = [this.resourcePath];
        this.callback(null, result.outputText, sm);
    }
    else {
        this.callback(null, result.outputText);
    }
};
