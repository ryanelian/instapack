import { loader } from 'webpack';
import * as TypeScript from 'typescript';
import { getOptions } from 'loader-utils';
import { RawSourceMap } from 'source-map';
import chalk from 'chalk';
import { checkSyntaxLevel } from '../SyntaxLevelChecker';
import * as upath from 'upath';

interface ILibGuardLoaderOptions {
    compilerOptions?: TypeScript.CompilerOptions;
}

export = function (this: loader.LoaderContext, source: string) {
    let options: ILibGuardLoaderOptions = getOptions(this);

    if (!options.compilerOptions) {
        this.emitError(new Error('TypeScript compiler options was not provided to LibGuard Loader!'));
        return;
    }

    let target = options.compilerOptions.target || TypeScript.ScriptTarget.ES5;
    if (target === TypeScript.ScriptTarget.ESNext) {
        // skip the whole validation-by-parse since ESNext means no transpilation
        this.callback(null, source);
        return;
    }

    let parse = checkSyntaxLevel(this.resourcePath, source, target);
    // console.log(parse.level, this.resourcePath);

    if (parse.level <= target) {
        this.callback(null, source);
        return;
    }

    let levelName = TypeScript.ScriptTarget[parse.level].toUpperCase();
    let rel = '/' + upath.relative(this.rootContext, this.resourcePath);
    console.log(`${chalk.yellow('LibGuard')}: ${chalk.red(levelName)} detected! ${chalk.cyan(rel)}`);

    // next version: transpile parse.source!
    this.callback(null, source);
    return;
}
