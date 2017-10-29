"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeScript = require("typescript");
const path = require("path");
let basePath = process.cwd();
let tsconfigPath = path.join(basePath, 'tsconfig.json');
let tsconfigRaw = TypeScript.readConfigFile(tsconfigPath, TypeScript.sys.readFile).config;
let tsconfig = TypeScript.parseJsonConfigFileContent(tsconfigRaw, TypeScript.sys, basePath);
tsconfig.options.moduleResolution = TypeScript.ModuleResolutionKind.NodeJs;
tsconfig.options.noEmit = false;
module.exports = function (source) {
    tsconfig.options.sourceMap = this.sourceMap;
    tsconfig.options.inlineSources = this.sourceMap;
    let result = TypeScript.transpileModule(source, {
        compilerOptions: tsconfig.options,
        fileName: this.resourcePath
    });
    let sm = JSON.parse(result.sourceMapText);
    sm.sources = [this.resourcePath];
    this.callback(null, result.outputText, JSON.stringify(sm));
};
