"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeScript = require("typescript");
const loader_utils_1 = require("loader-utils");
module.exports = function (source) {
    let options = loader_utils_1.getOptions(this);
    let result = TypeScript.transpileModule(source, {
        compilerOptions: options.compilerOptions,
        fileName: this.resourcePath
    });
    if (result.diagnostics.length) {
        let error = Error(result.diagnostics[0].messageText.toString());
        this.callback(error);
        return;
    }
    if (this.sourceMap) {
        let sm = JSON.parse(result.sourceMapText);
        sm.sources = [this.resourcePath];
        this.callback(null, result.outputText, JSON.stringify(sm));
    }
    else {
        this.callback(null, result.outputText);
    }
};
