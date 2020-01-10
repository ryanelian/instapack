import { loader } from 'webpack';
import * as TypeScript from 'typescript';
import { getOptions } from 'loader-utils';
import { RawSourceMap } from 'source-map';
import acorn = require('acorn');
import chalk = require('chalk');

interface TranspileLibraryLoaderOptions {
    compilerOptions?: TypeScript.CompilerOptions;
}

function isES5(source: string): boolean {
    try {
        acorn.parse(source, {
            ecmaVersion: 5,
            sourceType: 'module'
        });

        return true;
    } catch (error) {
        return false;
    }
}

export = function (this: loader.LoaderContext, source: string): void {
    const options: TranspileLibraryLoaderOptions = getOptions(this);
    if (!options || !options.compilerOptions) {
        this.emitError(new Error('TypeScript compiler options was not provided to Transpile Library Loader!'));
        return;
    }

    if (isES5(source)) {
        this.callback(null, source);
        return;
    }
    console.log(`${chalk.yellow("Transpiling to ES5")}: ${this.resourcePath}`);

    const baseCompilerOptions = options.compilerOptions;

    const compilerOptions = TypeScript.getDefaultCompilerOptions();
    compilerOptions.target = TypeScript.ScriptTarget.ES5;
    compilerOptions.moduleResolution = TypeScript.ModuleResolutionKind.NodeJs;
    compilerOptions.allowJs = true;
    compilerOptions.allowSyntheticDefaultImports = true;
    compilerOptions.downlevelIteration = true;

    compilerOptions.module = baseCompilerOptions.module ?? TypeScript.ModuleKind.ESNext;
    compilerOptions.importHelpers = baseCompilerOptions.importHelpers;
    compilerOptions.sourceMap = baseCompilerOptions.sourceMap;
    compilerOptions.inlineSources = baseCompilerOptions.inlineSources;
    compilerOptions.experimentalDecorators = baseCompilerOptions.experimentalDecorators;

    const result = TypeScript.transpileModule(source, {
        compilerOptions: compilerOptions,
        fileName: this.resourcePath
    });

    if (result.diagnostics && result.diagnostics[0]) {
        const error = Error(result.diagnostics[0].messageText.toString());
        this.callback(error);
        return;
    }

    // console.log(result.outputText);
    // console.log(isES5(result.outputText));
    if (this.sourceMap && result.sourceMapText) {
        const sm: RawSourceMap = JSON.parse(result.sourceMapText);
        sm.sources = [this.resourcePath];
        this.callback(null, result.outputText, sm);
    } else {
        this.callback(null, result.outputText);
    }
}
