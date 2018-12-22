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

function transpileModuleAst(resourcePath: string, source: TypeScript.SourceFile, options: TypeScript.CompilerOptions) {
    resourcePath = upath.toUnix(resourcePath);

    let transpileOptions = TypeScript.getDefaultCompilerOptions();
    transpileOptions.isolatedModules = true;
    transpileOptions.noLib = true;
    transpileOptions.noResolve = true;

    transpileOptions.lib = undefined;
    transpileOptions.types = undefined;
    transpileOptions.noEmit = undefined;
    transpileOptions.noEmitOnError = undefined;
    transpileOptions.emitDeclarationOnly = undefined;
    transpileOptions.paths = undefined;
    transpileOptions.rootDirs = undefined;
    transpileOptions.declaration = undefined;
    transpileOptions.composite = undefined;
    transpileOptions.declarationDir = undefined;
    transpileOptions.out = undefined;
    transpileOptions.outFile = undefined;

    // internal: https://github.com/Microsoft/TypeScript/blob/865b3e786277233585e1586edba52bf837b61b71/src/services/transpile.ts#L33
    transpileOptions['suppressOutputPathCheck'] = true;
    // transpileOptions['allowNonTsExtensions'] = true;

    transpileOptions.allowJs = true;
    transpileOptions.importHelpers = options.importHelpers;
    transpileOptions.target = options.target;
    transpileOptions.module = options.module;
    transpileOptions.moduleResolution = options.moduleResolution;
    transpileOptions.sourceMap = options.sourceMap;
    transpileOptions.inlineSources = options.inlineSources;
    // console.log(transpileOptions);

    let result: {
        output: string | undefined;
        map: string | undefined;
    } = {
        output: undefined,
        map: undefined
    };

    const host: TypeScript.CompilerHost = {
        getSourceFile: (fileName) => {
            if (fileName === resourcePath) {
                return source;
            }

            return undefined;
        },
        writeFile: (name, text) => { },
        getDefaultLibFileName: (opts) => "lib.d.ts",
        useCaseSensitiveFileNames: () => false,
        getCanonicalFileName: fileName => fileName,
        getCurrentDirectory: () => "",
        getNewLine: () => TypeScript.sys.newLine,
        fileExists: (fileName): boolean => fileName === resourcePath,
        readFile: (fileName) => {
            throw new Error(`transpileModule should not readFile (${fileName})`);
        },
        directoryExists: (path) => true,
        getDirectories: (path) => []
    };

    const program = TypeScript.createProgram([resourcePath], transpileOptions, host);
    const emit = program.emit(undefined, (name, text) => {
        if (name.endsWith('.map')) {
            if (result.map) {
                throw new Error('[LibGuard] Unexpected multiple Source Map output: ' + name);
            }

            result.map = text;
        } else {
            if (result.output) {
                throw new Error('[LibGuard] Unexpected multiple JS output: ' + name);
            }

            result.output = text;
        }
    });

    return result;
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

    let levelFrom = TypeScript.ScriptTarget[parse.level].toUpperCase();
    let levelTo = TypeScript.ScriptTarget[target].toUpperCase();
    let rel = '/' + upath.relative(this.rootContext, this.resourcePath);
    console.log(`${chalk.yellow('LibGuard')}: Transpiling dependency ${chalk.red(levelFrom)} >> ${chalk.yellow(levelTo)} ${chalk.cyan(rel)}`);

    let result = transpileModuleAst(this.resourcePath, parse.source, options.compilerOptions);
    // console.log(result);
    if (this.sourceMap && result.map) {
        // console.log(this.resourcePath);
        let sm: RawSourceMap = JSON.parse(result.map);
        sm.sources = [this.resourcePath];
        // HACK78
        this.callback(null, result.output, sm as any);
    } else {
        this.callback(null, result.output);
    }
}
