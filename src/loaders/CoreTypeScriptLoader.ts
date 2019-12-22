import { loader } from 'webpack';
import * as TypeScript from 'typescript';
import { getOptions } from 'loader-utils';

interface CoreTypeScriptLoaderOptions {
    compilerOptions?: TypeScript.CompilerOptions;
}

export = function (this: loader.LoaderContext, source: string): void {
    const options: CoreTypeScriptLoaderOptions = getOptions(this);

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
        // console.log(this.resourcePath);
        const sm = JSON.parse(result.sourceMapText); // RawSourceMap
        sm.sources = [this.resourcePath];
        this.callback(null, result.outputText, sm);
    } else {
        this.callback(null, result.outputText);
    }
}
