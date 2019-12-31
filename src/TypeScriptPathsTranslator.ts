import * as upath from 'upath';
import { CompilerOptions } from 'typescript';
import { Shout } from './Shout';
import chalk = require('chalk');

/**
 * A simple helper function for resolving TypeScript paths, trimming * from the rightmost path.
 * @param baseUrl 
 * @param value 
 */
function convertTypeScriptPathToWebpackAliasPath(rootPath: string, baseUrl: string, value: string): string {
    if (upath.isAbsolute(baseUrl) === false) {
        baseUrl = upath.join(rootPath, baseUrl);
    }
    let result = upath.join(baseUrl, value);
    if (result.endsWith('/*')) {
        result = result.substr(0, result.length - 2);
    }

    // console.log(baseUrl, value, JSON.stringify(result));
    return result;
}

function convertMapSetOfStringToArray(arg: MapLike<Set<string>>): MapLike<string[]> {
    const result: MapLike<string[]> = {};

    for (const key in arg) {
        const value = Array.from(arg[key]);
        if (value.length) {
            result[key] = value;
        }
    }

    return result;
}

/*
    paths mappings are relative to baseUrl, which is relative to tsconfig.json location
    {
      "compilerOptions": {
        "baseUrl": "./client/js",
        "paths": {
            "*": [
                "*",
                "global/*"
            ],
            "jquery": ["custom_library/jquery"],
            "jquery/*": ["custom_library/jquery/*"]
        }
      }
    }
    
======== Resolving module 'abc/def' from 'D:/VS/test/client/js/index.ts'. ========
Explicitly specified module resolution kind: 'NodeJs'.
'baseUrl' option is set to 'D:/VS/test/client/js', using this value to resolve non-relative module name 'abc/def'.
'paths' option is specified, looking for a pattern to match module name 'abc/def'.
Module name 'abc/def', matched pattern '*'.
Trying substitution '*', candidate module location: 'abc/def'.
Loading module as file / folder, candidate module location 'D:/VS/test/client/js/abc/def', target file type 'TypeScript'.
Trying substitution 'global/*', candidate module location: 'global/abc/def'.
Loading module as file / folder, candidate module location 'D:/VS/test/client/js/global/abc/def', target file type 'TypeScript'.
Loading module 'abc/def' from 'node_modules' folder, target file type 'TypeScript'.
    
======== Resolving module 'jquery' from 'D:/VS/test/client/js/index.ts'. ========
Explicitly specified module resolution kind: 'NodeJs'.
'baseUrl' option is set to 'D:/VS/test/client/js', using this value to resolve non-relative module name 'jquery'.
'paths' option is specified, looking for a pattern to match module name 'jquery'.
Module name 'jquery', matched pattern 'jquery'.
Trying substitution 'custom_library/jquery', candidate module location: 'custom_library/jquery'.
Loading module as file / folder, candidate module location 'D:/VS/test/client/js/custom_library/jquery', target file type 'TypeScript'.
Loading module 'jquery' from 'node_modules' folder, target file type 'TypeScript'.

======== Resolving module 'jquery/test' from 'D:/VS/test/client/js/index.ts'. ========
Explicitly specified module resolution kind: 'NodeJs'.
'baseUrl' option is set to 'D:/VS/test/client/js', using this value to resolve non-relative module name 'jquery/test'.
'paths' option is specified, looking for a pattern to match module name 'jquery/test'.
Module name 'jquery/test', matched pattern 'jquery/*'.
Trying substitution 'custom_library/jquery/*', candidate module location: 'custom_library/jquery/test'.
Loading module as file / folder, candidate module location 'D:/VS/test/client/js/custom_library/jquery/test', target file type 'TypeScript'.
Loading module 'jquery/test' from 'node_modules' folder, target file type 'TypeScript'.

======================================================================================
instapack paths translation result:

resolve.alias
{
    'jquery$': [ 'D:/VS/test/client/js/custom_library/jquery' ],
    jquery: [ 'D:/VS/test/client/js/custom_library/jquery' ]
}

resolve.modules
[
    'D:/VS/test/client/js',
    'D:/VS/test/client/js/global',
    'node_modules'
]
    */

/**
 * Translates tsconfig.json paths into webpack-compatible aliases!
 */
export function mergeTypeScriptPathAlias(compilerOptions: CompilerOptions, rootPath: string, alias: MapLike<string>): MapLike<string[]> {
    const result: MapLike<Set<string>> = {};
    for (const key in alias) {
        const value = alias[key];
        result[key] = new Set<string>([value]);
    }

    // https://webpack.js.org/configuration/resolve/#resolvealias
    // https://www.typescriptlang.org/docs/handbook/module-resolution.html
    if (compilerOptions.paths === undefined) {
        return convertMapSetOfStringToArray(result);
    }

    if (compilerOptions.baseUrl === undefined) {
        Shout.warning(chalk.cyan('tsconfig.json'),
            'paths are defined, but baseUrl is not!',
            chalk.grey('(Ignoring paths)'));
        return convertMapSetOfStringToArray(result);
    }

    for (const key in compilerOptions.paths) {
        if (key === '*') {
            // configure this in resolve.modules / getWildcardModules() instead
            continue;
        }

        let compatKey = key + '$';
        if (key.endsWith('/*')) {
            compatKey = key.substr(0, key.length - 2);
        }
        if (result[compatKey] === undefined) {
            result[compatKey] = new Set<string>();
        }

        for (const value of compilerOptions.paths[key]) {
            const compatValue = convertTypeScriptPathToWebpackAliasPath(rootPath, compilerOptions.baseUrl, value);
            result[compatKey].add(compatValue);
        }
    }

    return convertMapSetOfStringToArray(result);
}

/**
 * Returns lookup folders for non-relative module imports, from TypeScript * paths. 
 */
export function getWildcardModules(compilerOptions: CompilerOptions, rootPath: string): string[] | undefined {
    // https://webpack.js.org/configuration/resolve/#resolvemodules

    if (compilerOptions.baseUrl === undefined) {
        return undefined;
    }

    const r = new Set<string>();
    const p = compilerOptions.paths;

    if (p && p['*']) {
        for (const value of p['*']) {
            const result = convertTypeScriptPathToWebpackAliasPath(rootPath, compilerOptions.baseUrl, value);
            r.add(result);
        }
    } else {
        r.add(compilerOptions.baseUrl);
    }

    r.add('node_modules'); // default webpack module resolution folder
    return Array.from(r);
}