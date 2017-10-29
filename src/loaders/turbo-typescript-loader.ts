import { loader } from 'webpack';
import * as TypeScript from 'typescript';
import { tryGetTsConfigCompilerOptions } from '../TypeScriptOptionsReader';

module.exports = function (this: loader.LoaderContext, source: string) {
    let options = tryGetTsConfigCompilerOptions();
    options.sourceMap = this.sourceMap;
    options.inlineSources = this.sourceMap;

    let result = TypeScript.transpileModule(source, {
        compilerOptions: options,
        fileName: this.resourcePath
    });

    let sm: sourceMap.RawSourceMap = JSON.parse(result.sourceMapText);
    sm.sources = [this.resourcePath];

    this.callback(null, result.outputText, JSON.stringify(sm));
}
