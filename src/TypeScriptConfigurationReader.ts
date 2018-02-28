import * as upath from 'upath';
import * as TypeScript from 'typescript';

/**
 * Read the latest TypeScript compiler unit config.
 */
export function parseUserTsConfig() {
    let basePath = process.cwd();
    let tsconfigPath = upath.join(basePath, 'tsconfig.json');

    let tsconfigJson = TypeScript.readConfigFile(tsconfigPath, TypeScript.sys.readFile);
    if (tsconfigJson.error) {
        throw Error(tsconfigJson.error.messageText.toString());
    }
    // console.log(tsconfigJson);
    let tsconfig = TypeScript.parseJsonConfigFileContent(tsconfigJson.config, TypeScript.sys, basePath);
    if (tsconfig.errors.length) {
        throw Error(tsconfig.errors[0].messageText.toString());
    }
    // console.log(tsconfig);
    return tsconfig;
}

let _options: TypeScript.CompilerOptions;

/**
 * Attempts to lazy-load user's tsconfig.json Compiler Options.
 */
export function getLazyCompilerOptions() {
    if (_options) {
        return _options;
    }

    _options = parseUserTsConfig().options;
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
