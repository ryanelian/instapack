"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeScript = require("typescript");
const path = require("path");
const CompilerUtilities_1 = require("../CompilerUtilities");
let basePath = process.cwd();
let tsconfigPath = path.join(basePath, 'tsconfig.json');
let tsconfigRaw = TypeScript.readConfigFile(tsconfigPath, TypeScript.sys.readFile).config;
let tsconfig = TypeScript.parseJsonConfigFileContent(tsconfigRaw, TypeScript.sys, basePath);
tsconfig.options.moduleResolution = TypeScript.ModuleResolutionKind.NodeJs;
tsconfig.options.sourceMap = true;
tsconfig.options.noEmit = false;
module.exports = function (source) {
    let result = TypeScript.transpileModule(source, {
        compilerOptions: tsconfig.options,
        fileName: this.resourcePath
    });
    let s = CompilerUtilities_1.convertAbsoluteToSourceMapPath(process.cwd(), this.resourcePath);
    this.callback(null, result.outputText, result.sourceMapText);
};
