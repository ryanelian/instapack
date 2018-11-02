import { loader } from 'webpack';
import * as TypeScript from 'typescript';
import { getOptions } from 'loader-utils';
import { RawSourceMap } from 'source-map';
import chalk from 'chalk';
import { checkLevel } from '../LevelCheck';
import * as upath from 'upath';

interface ICoreTypeScriptLoaderOptions {
    compilerOptions?: TypeScript.CompilerOptions;
}

export = function (this: loader.LoaderContext, source: string) {
    let options: ICoreTypeScriptLoaderOptions = getOptions(this);

    if (!options.compilerOptions) {
        this.emitError(new Error('TypeScript compiler options was not provided to Core TypeScript Loader!'));
        return;
    }

    if (this.resourcePath.endsWith('.js') || this.resourcePath.endsWith('.mjs')) {
        let target = options.compilerOptions.target || TypeScript.ScriptTarget.ES5;
        if (target === TypeScript.ScriptTarget.ESNext) {
            // skip the whole validation-by-parse since ESNext means no transpilation
            this.callback(null, source);
            return;
        }

        let parse = checkLevel(this.resourcePath, source, target);
        // console.log(parse.level, this.resourcePath);

        if (parse.level <= target) {
            this.callback(null, source);
            return;
        }

        let levelName = TypeScript.ScriptTarget[parse.level].toUpperCase();
        let rel = '/' + upath.relative(this.rootContext, this.resourcePath);
        console.log(`${chalk.yellow('LibGuard')}: ${chalk.red(levelName)} detected! ${chalk.cyan(rel)}`);

        // next version: transpile parse.source immediately!
        this.callback(null, source);
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
