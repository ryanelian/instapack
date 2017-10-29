import { loader } from 'webpack';
import * as TypeScript from 'typescript';
import * as fse from 'fs-extra';
import * as path from 'path';
import { convertAbsoluteToSourceMapPath } from '../CompilerUtilities';

let basePath = process.cwd();
let tsconfigPath = path.join(basePath, 'tsconfig.json');
let tsconfigRaw = TypeScript.readConfigFile(tsconfigPath, TypeScript.sys.readFile).config;
let tsconfig = TypeScript.parseJsonConfigFileContent(tsconfigRaw, TypeScript.sys, basePath);

// console.log(tsconfig);
tsconfig.options.moduleResolution = TypeScript.ModuleResolutionKind.NodeJs;
tsconfig.options.noEmit = false;

module.exports = function (this: loader.LoaderContext, source: string) {
    tsconfig.options.sourceMap = this.sourceMap;
    tsconfig.options.inlineSources = this.sourceMap;

    let result = TypeScript.transpileModule(source, {
        compilerOptions: tsconfig.options,
        fileName: this.resourcePath
    });

    let sm: sourceMap.RawSourceMap = JSON.parse(result.sourceMapText);
    sm.sources = [this.resourcePath];

    this.callback(null, result.outputText, JSON.stringify(sm));
}
