"use strict";
const TypeScript = require("typescript");
const loader_utils_1 = require("loader-utils");
const chalk = require("chalk");
const SyntaxLevelChecker_1 = require("../SyntaxLevelChecker");
const upath = require("upath");
function createTranspileModuleAstOptions(baseOptions) {
    const transpileOptions = TypeScript.getDefaultCompilerOptions();
    transpileOptions.isolatedModules = true;
    transpileOptions.suppressOutputPathCheck = true;
    transpileOptions.allowNonTsExtensions = true;
    transpileOptions.allowJs = true;
    transpileOptions.noResolve = true;
    transpileOptions.noLib = true;
    transpileOptions.importHelpers = baseOptions.importHelpers;
    transpileOptions.target = baseOptions.target;
    transpileOptions.module = baseOptions.module;
    transpileOptions.moduleResolution = baseOptions.moduleResolution;
    transpileOptions.sourceMap = baseOptions.sourceMap;
    transpileOptions.inlineSources = baseOptions.inlineSources;
    return transpileOptions;
}
function transpileModuleAst(resourcePath, source, options) {
    resourcePath = upath.toUnix(resourcePath);
    const transpileOptions = createTranspileModuleAstOptions(options);
    let output = undefined;
    let map = undefined;
    const host = {
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
            }
            else {
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
        fileExists: (fileName) => fileName === resourcePath,
        readFile: () => "",
        directoryExists: () => true,
        getDirectories: () => []
    };
    const program = TypeScript.createProgram([resourcePath], transpileOptions, host);
    program.emit();
    if (output === undefined) {
        throw new Error('[LibGuard] JS generation failed!');
    }
    return { output, map };
}
module.exports = function (source) {
    const options = loader_utils_1.getOptions(this);
    if (!options.compilerOptions) {
        this.emitError(new Error('TypeScript compiler options was not provided to LibGuard Loader!'));
        return;
    }
    const target = options.compilerOptions.target || TypeScript.ScriptTarget.ES5;
    if (target === TypeScript.ScriptTarget.ESNext) {
        this.callback(null, source);
        return;
    }
    const parse = SyntaxLevelChecker_1.checkSyntaxLevel(this.resourcePath, source, target);
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
        if (this.sourceMap && result.map) {
            const sm = JSON.parse(result.map);
            sm.sources = [this.resourcePath];
            this.callback(null, result.output, sm);
        }
        else {
            this.callback(null, result.output);
        }
    }
    catch (error) {
        this.callback(error);
    }
};
