import * as path from 'path';
import chalk from 'chalk';
import * as TypeScript from 'typescript';

/**
 * Read the latest TypeScript compiler unit config.
 */
export function parseTsConfig() {
    let basePath = process.cwd();
    let tsconfigPath = path.join(basePath, 'tsconfig.json');

    try {
        let tsconfigJson = TypeScript.readConfigFile(tsconfigPath, TypeScript.sys.readFile);
        if (tsconfigJson.error) {
            throw Error(tsconfigJson.error.messageText.toString());
        }
        let tsconfig = TypeScript.parseJsonConfigFileContent(tsconfigJson.config, TypeScript.sys, basePath);
        if (tsconfig.errors.length) {
            throw Error(tsconfig.errors[0].messageText.toString());
        }
        return tsconfig;
    } catch (error) {
        console.error(chalk.red('ERROR'), 'Failed to read', chalk.cyan('tsconfig.json'));
        console.error(error);
        throw error;
    }
}

let _options: TypeScript.CompilerOptions;

/**
 * Attempts to lazy-load user's tsconfig.json Compiler Options and force-set sane defaults.
 */
export function getLazyCompilerOptions() {
    if (_options) {
        return _options;
    }

    _options = parseTsConfig().options;
    _options.moduleResolution = TypeScript.ModuleResolutionKind.NodeJs;
    _options.noEmit = false;

    return _options
}

/**
 * Returns compiler options target as its enum name string representative.
 */
export function getTypeScriptTarget() {
    let t = getLazyCompilerOptions().target;
    if (!t) {
        t = TypeScript.ScriptTarget.ES3;
    }
    return TypeScript.ScriptTarget[t];
}

/**
 * Returns dynamic UglifyES ECMA minification option based on user's TypeScript build target.
 */
function getUglifyESTarget() {
    switch (getTypeScriptTarget()) {
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
