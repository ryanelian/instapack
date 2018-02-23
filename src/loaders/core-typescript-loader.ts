import { loader } from 'webpack';
import * as TypeScript from 'typescript';
import { getOptions } from 'loader-utils';
import { RawSourceMap } from 'source-map';

interface CoreTypeScriptLoaderOptions {
    compilerOptions: TypeScript.CompilerOptions;
}

module.exports = function (this: loader.LoaderContext, source: string) {
    let options = getOptions(this) as CoreTypeScriptLoaderOptions;

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
        // console.log(this.resourcePath);
        let sm = JSON.parse(result.sourceMapText) as RawSourceMap;
        sm.sources = [this.resourcePath];
        // HACK: https://github.com/webpack/webpack-sources/issues/34
        this.callback(null, result.outputText, sm as any);
    } else {
        this.callback(null, result.outputText);
    }
}
