import { loader } from 'webpack';
import * as TypeScript from 'typescript';
import { getOptions } from 'loader-utils';
import { RawSourceMap } from 'source-map';

interface ICoreTypeScriptLoaderOptions {
    compilerOptions?: TypeScript.CompilerOptions;
}

export = function (this: loader.LoaderContext, source: string) {
    let options: ICoreTypeScriptLoaderOptions = getOptions(this);

    if (!options.compilerOptions) {
        this.emitError(new Error('TypeScript compiler options was not provided to Core TypeScript Loader!'));
        return;
    }

    let result = TypeScript.transpileModule(source, {
        compilerOptions: options.compilerOptions,
        fileName: this.resourcePath
    });

    if (result.diagnostics && result.diagnostics[0]) {
        let error = Error(result.diagnostics[0].messageText.toString());
        this.callback(error);
        return;
    }

    if (this.sourceMap && result.sourceMapText) {
        // console.log(this.resourcePath);
        let sm: RawSourceMap = JSON.parse(result.sourceMapText);
        sm.sources = [this.resourcePath];
        // HACK78
        this.callback(null, result.outputText, sm as any);
    } else {
        this.callback(null, result.outputText);
    }
}
