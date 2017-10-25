import * as fse from 'fs-extra';
import * as path from 'path';

/**
 * Gets tsconfig file path where the commmand line is invoked. 
 */
function getUserTsconfigPath() {
    return path.join(process.cwd(), 'tsconfig.json');
}

let _tsconfigTarget: string;

/**
 * Attempts to lazy parse user's tsconfig.json for TypeScript build target option.
 */
export function tryGetTypeScriptTarget() {
    try {
        if (_tsconfigTarget) {
            return _tsconfigTarget;
        }

        let tsconfig = fse.readJSONSync(getUserTsconfigPath());
        _tsconfigTarget = tsconfig.compilerOptions.target as string;
        _tsconfigTarget = _tsconfigTarget.toUpperCase();

        return _tsconfigTarget;
    }
    catch {
        return 'ES5';
    }
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
        ecma: getUglifyESTarget(),
        sourceMap: undefined
    };
}
