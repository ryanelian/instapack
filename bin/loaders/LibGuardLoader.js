"use strict";
const TypeScript = require("typescript");
const loader_utils_1 = require("loader-utils");
const chalk_1 = require("chalk");
const SyntaxLevelChecker_1 = require("../SyntaxLevelChecker");
const upath = require("upath");
function transpileModuleAst(resourcePath, source, options) {
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
    transpileOptions['suppressOutputPathCheck'] = true;
    transpileOptions.allowJs = true;
    transpileOptions.importHelpers = options.importHelpers;
    transpileOptions.target = options.target;
    transpileOptions.module = options.module;
    transpileOptions.moduleResolution = options.moduleResolution;
    transpileOptions.sourceMap = options.sourceMap;
    transpileOptions.inlineSources = options.inlineSources;
    let result = {
        output: undefined,
        map: undefined
    };
    const host = {
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
        fileExists: (fileName) => fileName === resourcePath,
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
        }
        else {
            if (result.output) {
                throw new Error('[LibGuard] Unexpected multiple JS output: ' + name);
            }
            result.output = text;
        }
    });
    return result;
}
module.exports = function (source) {
    let options = loader_utils_1.getOptions(this);
    if (!options.compilerOptions) {
        this.emitError(new Error('TypeScript compiler options was not provided to LibGuard Loader!'));
        return;
    }
    let target = options.compilerOptions.target || TypeScript.ScriptTarget.ES5;
    if (target === TypeScript.ScriptTarget.ESNext) {
        this.callback(null, source);
        return;
    }
    let parse = SyntaxLevelChecker_1.checkSyntaxLevel(this.resourcePath, source, target);
    if (parse.level <= target) {
        this.callback(null, source);
        return;
    }
    let levelFrom = TypeScript.ScriptTarget[parse.level].toUpperCase();
    let levelTo = TypeScript.ScriptTarget[target].toUpperCase();
    let rel = '/' + upath.relative(this.rootContext, this.resourcePath);
    console.log(`${chalk_1.default.yellow('LibGuard')}: Transpiling ${chalk_1.default.red(levelFrom)} >> ${chalk_1.default.yellow(levelTo)} deps! ${chalk_1.default.cyan(rel)}`);
    let result = transpileModuleAst(this.resourcePath, parse.source, options.compilerOptions);
    if (this.sourceMap && result.map) {
        let sm = JSON.parse(result.map);
        sm.sources = [this.resourcePath];
        this.callback(null, result.output, sm);
    }
    else {
        this.callback(null, result.output);
    }
};
