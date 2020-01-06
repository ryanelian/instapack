import { loader } from 'webpack';
import * as TypeScript from 'typescript';
import { getOptions } from 'loader-utils';
import chalk = require('chalk');
import { checkSyntaxLevel } from '../SyntaxLevelChecker';
import * as upath from 'upath';
import { RawSourceMap } from 'source-map';

interface LibGuardLoaderOptions {
    compilerOptions?: TypeScript.CompilerOptions;
}

interface TypeScriptTranspileResult {
    output: string;
    map: string | undefined;
}

function createTranspileModuleAstOptions(baseOptions: TypeScript.CompilerOptions): TypeScript.CompilerOptions {
    const transpileOptions = TypeScript.getDefaultCompilerOptions();
    transpileOptions.isolatedModules = true;

    // https://github.com/microsoft/TypeScript/blob/master/src/services/transpile.ts
    // transpileModule does not write anything to disk so there is no need to verify that there are no conflicts between input and output paths.
    transpileOptions.suppressOutputPathCheck = true;

    // Filename can be non-ts file.
    transpileOptions.allowNonTsExtensions = true;
    transpileOptions.allowJs = true;

    // We are not doing a full typecheck, we are not resolving the whole context,
    // so pass --noResolve to avoid reporting missing file errors.
    transpileOptions.noResolve = true;

    // We are not returning a sourceFile for lib file when asked by the program,
    // so pass --noLib to avoid reporting a file not found error.
    transpileOptions.noLib = true;

    transpileOptions.importHelpers = baseOptions.importHelpers;
    transpileOptions.target = baseOptions.target;
    transpileOptions.module = baseOptions.module;
    transpileOptions.moduleResolution = baseOptions.moduleResolution;
    transpileOptions.sourceMap = baseOptions.sourceMap;
    transpileOptions.inlineSources = baseOptions.inlineSources;

    // console.log(transpileOptions);
    return transpileOptions;
}

function transpileModuleAst(resourcePath: string, source: TypeScript.SourceFile, options: TypeScript.CompilerOptions): TypeScriptTranspileResult {
    resourcePath = upath.toUnix(resourcePath);

    const transpileOptions = createTranspileModuleAstOptions(options);
    let output: string | undefined = undefined;
    let map: string | undefined = undefined;

    const host: TypeScript.CompilerHost = {
        getSourceFile: (fileName) => {
            if (fileName === resourcePath) {
                return source;
            }

            return undefined;
        },
        writeFile: (name, text) => {
            if (name.endsWith('.map')) {
                if (map) {
                    throw new Error('[LibGuard] Unexpected multiple source map outputs: ' + name);
                }

                map = text;
            } else {
                if (output) {
                    throw new Error('[LibGuard] Unexpected multiple JS outputs: ' + name);
                }

                output = text;
            }
        },
        getDefaultLibFileName: () => "lib.d.ts",
        useCaseSensitiveFileNames: () => false,
        getCanonicalFileName: fileName => fileName,
        getCurrentDirectory: () => "",
        getNewLine: () => TypeScript.sys.newLine,
        fileExists: (fileName): boolean => fileName === resourcePath,
        readFile: () => "",
        directoryExists: () => true,
        getDirectories: () => []
    };

    const program = TypeScript.createProgram([resourcePath], transpileOptions, host);
    program.emit();

    // program emit appears to be sync, as seen in original source code
    if (output === undefined) {
        throw new Error('[LibGuard] JS generation failed!');
    }

    return { output, map };
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
            const sm: RawSourceMap = JSON.parse(result.map);
            sm.sources = [this.resourcePath];
            this.callback(null, result.output, sm);
        } else {
            this.callback(null, result.output);
        }
    } catch (error) {
        this.callback(error);
    }
}
