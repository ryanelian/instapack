"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const typescript_1 = __importDefault(require("typescript"));
const loader_utils_1 = require("loader-utils");
module.exports = function (source) {
    let options = loader_utils_1.getOptions(this);
    let result = typescript_1.default.transpileModule(source, {
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
