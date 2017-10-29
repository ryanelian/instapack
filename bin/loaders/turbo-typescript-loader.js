"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeScript = require("typescript");
const TypeScriptOptionsReader_1 = require("../TypeScriptOptionsReader");
module.exports = function (source) {
    let options = TypeScriptOptionsReader_1.tryGetTsConfigCompilerOptions();
    options.sourceMap = this.sourceMap;
    options.inlineSources = this.sourceMap;
    let result = TypeScript.transpileModule(source, {
        compilerOptions: options,
        fileName: this.resourcePath
    });
    let sm = JSON.parse(result.sourceMapText);
    sm.sources = [this.resourcePath];
    this.callback(null, result.outputText, JSON.stringify(sm));
};
