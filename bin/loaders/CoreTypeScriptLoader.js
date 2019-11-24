"use strict";
const TypeScript = require("typescript");
const loader_utils_1 = require("loader-utils");
module.exports = function (source) {
    const options = loader_utils_1.getOptions(this);
    if (!options.compilerOptions) {
        this.emitError(new Error('TypeScript compiler options was not provided to Core TypeScript Loader!'));
        return;
    }
    const result = TypeScript.transpileModule(source, {
        compilerOptions: options.compilerOptions,
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
