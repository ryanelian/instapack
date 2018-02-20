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
        let sm: RawSourceMap = JSON.parse(result.sourceMapText);
        sm.sources = [this.resourcePath];

        this.callback(null, result.outputText, sm);
    } else {
        this.callback(null, result.outputText);
    }
}
