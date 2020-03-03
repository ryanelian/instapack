"use strict";
const TypeScript = require("typescript");
const loader_utils_1 = require("loader-utils");
const acorn = require("acorn");
const chalk = require("chalk");
function isES5(source) {
    try {
        acorn.parse(source, {
            ecmaVersion: 5,
            sourceType: 'module'
        });
        return true;
    }
    catch (error) {
        return false;
    }
}
module.exports = function (source) {
    var _a;
    const options = loader_utils_1.getOptions(this);
    if (!options || !options.compilerOptions) {
        this.emitError(new Error('TypeScript compiler options was not provided to Transpile Library Loader!'));
        return;
    }
    if (isES5(source)) {
        this.callback(null, source);
        return;
    }
    console.log(`${chalk.yellow("Transpiling to ES5")}: ${this.resourcePath}`);
    const baseCompilerOptions = options.compilerOptions;
    const compilerOptions = TypeScript.getDefaultCompilerOptions();
    compilerOptions.target = TypeScript.ScriptTarget.ES5;
    compilerOptions.moduleResolution = TypeScript.ModuleResolutionKind.NodeJs;
    compilerOptions.allowJs = true;
    compilerOptions.allowSyntheticDefaultImports = true;
    compilerOptions.module = (_a = baseCompilerOptions.module) !== null && _a !== void 0 ? _a : TypeScript.ModuleKind.ESNext;
    compilerOptions.importHelpers = baseCompilerOptions.importHelpers;
    compilerOptions.sourceMap = baseCompilerOptions.sourceMap;
    compilerOptions.inlineSources = baseCompilerOptions.inlineSources;
    compilerOptions.experimentalDecorators = baseCompilerOptions.experimentalDecorators;
    compilerOptions.downlevelIteration = baseCompilerOptions.downlevelIteration;
    const result = TypeScript.transpileModule(source, {
        compilerOptions: compilerOptions,
        fileName: this.resourcePath
    });
    if (result.diagnostics && result.diagnostics[0]) {
        const error = Error(result.diagnostics[0].messageText.toString());
        this.callback(error);
        return;
    }
    if (this.sourceMap && result.sourceMapText) {
        const sm = JSON.parse(result.sourceMapText);
        sm.sources = [this.resourcePath];
        this.callback(null, result.outputText, sm);
    }
    else {
        this.callback(null, result.outputText);
    }
};
