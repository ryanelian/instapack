import * as path from 'path';
import chalk from 'chalk';
import * as TypeScript from 'typescript';

let tsCompilerOptions: TypeScript.CompilerOptions;

/**
 * Attempts to lazy parse user's tsconfig.json and force-set sane defaults. If fails, use the default compiler options.
 */
export function tryGetTsConfigCompilerOptions() {
    if (tsCompilerOptions) {
        return tsCompilerOptions;
    }

    let basePath = process.cwd();
    let tsconfigPath = path.join(basePath, 'tsconfig.json');

    tsCompilerOptions = TypeScript.getDefaultCompilerOptions();
    try {
        let tsconfigJson = TypeScript.readConfigFile(tsconfigPath, TypeScript.sys.readFile);
        if (tsconfigJson.error) {
            throw Error(tsconfigJson.error.messageText.toString());
        }
        let tsconfig = TypeScript.parseJsonConfigFileContent(tsconfigJson.config, TypeScript.sys, basePath);
        if (tsconfig.errors.length) {
            throw Error(tsconfig.errors[0].messageText.toString());
        }
        tsCompilerOptions = tsconfig.options;
    } catch (error) {
        console.error(chalk.red('ERROR'), 'Failed to read', chalk.cyan('tsconfig.json'), chalk.grey('(Fallback to default compiler options!)'));
        console.error(error);
    }

    tsCompilerOptions.moduleResolution = TypeScript.ModuleResolutionKind.NodeJs;
    tsCompilerOptions.noEmit = false;
    return tsCompilerOptions;
}

/**
 * Returns compiler options target as its enum name string representative.
 */
export function tryGetTypeScriptTarget() {
    let t = tryGetTsConfigCompilerOptions().target;
    if (!t) {
        t = TypeScript.ScriptTarget.ES3;
    }
    return TypeScript.ScriptTarget[t];
}

/**
 * Returns dynamic UglifyES ECMA minification option based on user's TypeScript build target.
 */
function getUglifyESTarget() {
    switch (tryGetTypeScriptTarget()) {
        case 'ES5': {
            return 5;
        }
        case 'ES2015': {
            return 6;
        }
        case 'ES2016': {
            return 7;
        }
        case 'ES2017': {
            return 8;
        }
        default: {
            return undefined;
        }
    }
}

/**
 * Creates a new UglifyES option object.
 */
export function createUglifyESOptions() {
    return {
        ecma: getUglifyESTarget()
    };
}
