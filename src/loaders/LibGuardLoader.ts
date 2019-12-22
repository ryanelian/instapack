import { loader } from 'webpack';
import * as TypeScript from 'typescript';
import { getOptions } from 'loader-utils';
import chalk = require('chalk');
import { checkSyntaxLevel } from '../SyntaxLevelChecker';
import * as upath from 'upath';

interface LibGuardLoaderOptions {
    compilerOptions?: TypeScript.CompilerOptions;
}

interface TypeScriptTranspileResult {
    output: string | undefined;
    map: string | undefined;
}

function transpileModuleAst(resourcePath: string, source: TypeScript.SourceFile, options: TypeScript.CompilerOptions): TypeScriptTranspileResult {
    resourcePath = upath.toUnix(resourcePath);

    const transpileOptions = TypeScript.getDefaultCompilerOptions();
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

    const result: TypeScriptTranspileResult = {
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
        writeFile: () => {
            throw new Error('LibGuard in-memory TypeScript compiler host should not write any files!');
        },
        getDefaultLibFileName: () => "lib.d.ts",
        useCaseSensitiveFileNames: () => false,
        getCanonicalFileName: fileName => fileName,
        getCurrentDirectory: () => "",
        getNewLine: () => TypeScript.sys.newLine,
        fileExists: (fileName): boolean => fileName === resourcePath,
        readFile: (fileName) => {
            throw new Error(`transpileModule should not readFile (${fileName})`);
        },
        directoryExists: () => true,
        getDirectories: () => []
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

    if (emit.diagnostics.length) {
        const errorMessage = emit.diagnostics.join('\n\n');
        throw new Error(errorMessage);
    }

    return result;
}

export = function (this: loader.LoaderContext, source: string): void {
    const options: LibGuardLoaderOptions = getOptions(this);

    if (!options.compilerOptions) {
        this.emitError(new Error('TypeScript compiler options was not provided to LibGuard Loader!'));
        return;
    }

    const target = options.compilerOptions.target || TypeScript.ScriptTarget.ES5;
    if (target === TypeScript.ScriptTarget.ESNext) {
        // skip the whole validation-by-parse since ESNext means no transpilation
        this.callback(null, source);
        return;
    }

    const parse = checkSyntaxLevel(this.resourcePath, source, target);
    // console.log(parse.level, this.resourcePath);

    if (parse.level <= target) {
        this.callback(null, source);
        return;
    }

    const levelFrom = TypeScript.ScriptTarget[parse.level].toUpperCase();
    const levelTo = TypeScript.ScriptTarget[target].toUpperCase();
    const rel = '/' + upath.relative(this.rootContext, this.resourcePath);
    console.log(`${chalk.yellow('LibGuard')}: Transpiling dependency ${chalk.red(levelFrom)} >> ${chalk.yellow(levelTo)} ${chalk.cyan(rel)}`);

    try {
        const result = transpileModuleAst(this.resourcePath, parse.source, options.compilerOptions);
        // console.log(result);
        if (this.sourceMap && result.map) {
            // console.log(this.resourcePath);
            const sm = JSON.parse(result.map); // RawSourceMap
            sm.sources = [this.resourcePath];
            // HACK78
            this.callback(null, result.output, sm);
        } else {
            this.callback(null, result.output);
        }
    } catch (error) {
        this.callback(error);
    }
}
