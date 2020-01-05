import * as fse from 'fs-extra';
import * as upath from 'upath';
import * as TypeScript from 'typescript';
import jsonc = require('strip-json-comments');
import { Shout } from './Shout';
import chalk = require('chalk');

const fallbackTypeScriptConfig = {
    compilerOptions: {
        "target": "ES2015",                       /* Specify ECMAScript target version: 'ES3' (default), 'ES5', 'ES2015', 'ES2016', 'ES2017', 'ES2018', 'ES2019' or 'ESNEXT'. */
        "module": "ESNext",                       /* Specify module code generation: 'none', 'commonjs', 'amd', 'system', 'umd', 'es2015', or 'ESNext'. */
        "lib": [                                  /* Specify library files to be included in the compilation. */
            "DOM",
            "DOM.Iterable",
            "ES2015",
        ],

        "resolveJsonModule": true,                /* Include modules imported with .json extension. */
        "jsx": "react",                           /* Specify JSX code generation: 'preserve', 'react-native', or 'react'. */
        "importHelpers": false,                   /* Import emit helpers from 'tslib'. */
        "strict": true,                           /* Enable all strict type-checking options. */
        "noImplicitAny": false,                   /* Raise error on expressions and declarations with an implied 'any' type. */
        "noImplicitReturns": true,                /* Report error when not all code paths in function return a value. */
        "noFallthroughCasesInSwitch": true,       /* Report errors for fallthrough cases in switch statement. */
        "moduleResolution": "node",               /* Specify module resolution strategy: 'node' (Node.js) or 'classic' (TypeScript pre-1.6). */
        "allowSyntheticDefaultImports": true,     /* Allow default imports from modules with no default export. This does not affect code emit, just typechecking. */
        "experimentalDecorators": true,           /* Enables experimental support for ES7 decorators. */
        "forceConsistentCasingInFileNames": true, /* Disallow inconsistently-cased references to the same file. */
        "skipLibCheck": true                      /* Skip type checking of all declaration files. */
    }
};

export function parseTypescriptConfig(folder: string, json: unknown): TypeScript.ParsedCommandLine {
    // apparently TypeScript.parseJsonConfigFileContent modifies the input object!
    // deep copy the object for unit test sanity...
    const o = JSON.parse(JSON.stringify(json));

    // https://github.com/Microsoft/TypeScript/blob/master/src/compiler/commandLineParser.ts#L992
    const tsconfig = TypeScript.parseJsonConfigFileContent(o, TypeScript.sys, folder);
    if (tsconfig.errors.length) {
        throw Error(tsconfig.errors[0].messageText.toString());
    }
    // console.log(tsconfig);
    return tsconfig;
}

export async function tryReadTypeScriptConfigJson(folder: string): Promise<unknown> {
    const tsconfigJsonPath = upath.join(folder, 'tsconfig.json');

    try {
        const tsconfigRaw = await fse.readFile(tsconfigJsonPath, 'utf8');
        const tsconfig = JSON.parse(jsonc(tsconfigRaw));
        const tryParse = parseTypescriptConfig(folder, tsconfig);
        const errorMessage = tryParse.errors.join('\n\n');
        if (tryParse.errors.length) {
            throw new Error(errorMessage);
        }

        return tsconfig;
    } catch (error) {
        Shout.error('when reading', chalk.cyan(tsconfigJsonPath), error);
        Shout.warning('Using the default fallback TypeScript configuration!');
        console.log(fallbackTypeScriptConfig);
        return fallbackTypeScriptConfig;
    }
}
