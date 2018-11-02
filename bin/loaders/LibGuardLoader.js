"use strict";
const TypeScript = require("typescript");
const loader_utils_1 = require("loader-utils");
const chalk_1 = require("chalk");
const SyntaxLevelChecker_1 = require("../SyntaxLevelChecker");
const upath = require("upath");
module.exports = function (source) {
    let options = loader_utils_1.getOptions(this);
    if (!options.compilerOptions) {
        this.emitError(new Error('TypeScript compiler options was not provided to LibGuard Loader!'));
        return;
    }
    let target = options.compilerOptions.target || TypeScript.ScriptTarget.ES5;
    if (target === TypeScript.ScriptTarget.ESNext) {
        this.callback(null, source);
        return;
    }
    let parse = SyntaxLevelChecker_1.checkSyntaxLevel(this.resourcePath, source, target);
    if (parse.level <= target) {
        this.callback(null, source);
        return;
    }
    let levelName = TypeScript.ScriptTarget[parse.level].toUpperCase();
    let rel = '/' + upath.relative(this.rootContext, this.resourcePath);
    console.log(`${chalk_1.default.yellow('LibGuard')}: ${chalk_1.default.red(levelName)} detected! ${chalk_1.default.cyan(rel)}`);
    this.callback(null, source);
    return;
};
