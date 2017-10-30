"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeScript = require("typescript");
const TypeScriptConfigurationReader_1 = require("../TypeScriptConfigurationReader");
module.exports = function (source) {
    let options = TypeScriptConfigurationReader_1.getLazyCompilerOptions();
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
