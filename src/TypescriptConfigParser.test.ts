import test from "ava";
import * as path from 'path';
import * as TypeScript from 'typescript';
import { parseTypescriptConfig, tryReadTypeScriptConfigJson } from "./TypescriptConfigParser";

const root = process.cwd();
const fixtures = path.join(root, 'fixtures');
const validFolder = path.join(fixtures, 'TypeScriptConfigValid');
const emptyFolder = path.join(fixtures, 'TypeScriptConfigEmpty');
const invalidFolder = path.join(fixtures, 'TypeScriptConfigInvalid');

test.before(() => {
    global.console.log = (): void => { /* disabled */ };
    global.console.error = (): void => { /* disabled */ };
    global.console.warn = (): void => { /* disabled */ };
});

test('Parse TypeScript Configuration: Error', t => {
    t.throws(() => {
        parseTypescriptConfig(validFolder, {
            compilerOptions: {
                alwaysStrict: true,
                skipLibCheck: true,
                noImplicitReturns: true,
                noFallthroughCasesInSwitch: true,
                allowSyntheticDefaultImports: true,

                target: "es5",
                module: "error",
                moduleResolution: "node"
            }
        });
    });
});

test('Parse TypeScript Configuration: OK', t => {
    const result = parseTypescriptConfig(validFolder, {
        "compilerOptions": {
            "noImplicitAny": false,
            "noImplicitThis": true,
            "alwaysStrict": true,

            "strictNullChecks": false,
            "strictFunctionTypes": false,
            "strictPropertyInitialization": false,
            "skipLibCheck": true,

            "noUnusedLocals": false,
            "noUnusedParameters": false,
            "noImplicitReturns": true,
            "noFallthroughCasesInSwitch": true,

            "experimentalDecorators": true,
            "allowSyntheticDefaultImports": true,
            "resolveJsonModule": true,

            "noEmit": true,
            "target": "es5",
            "module": "esnext",
            "moduleResolution": "node",
            "importHelpers": true,
            "jsx": "react",

            "lib": [
                "dom",
                "es5",
                "es2015.core",
                "es2015.promise",
                "es2015.collection",
                "es2015.reflect",
                "es2016.array.include",
                "es2017.string",
                "es2017.object",
                "es2017.typedarrays",
                "es2018.promise"
            ]
        },
        "exclude": [
            "node_modules"
        ]
    });

    t.true(
        result.options.noImplicitAny === false
        && result.options.noImplicitThis === true
        && result.options.alwaysStrict === true

        && result.options.strictNullChecks === false
        && result.options.strictFunctionTypes === false
        && result.options.strictPropertyInitialization === false
        && result.options.skipLibCheck === true

        && result.options.noUnusedLocals === false
        && result.options.noUnusedParameters === false
        && result.options.noImplicitReturns === true
        && result.options.noFallthroughCasesInSwitch === true

        && result.options.noEmit === true
        && result.options.target === TypeScript.ScriptTarget.ES5
        && result.options.module === TypeScript.ModuleKind.ESNext
        && result.options.moduleResolution === TypeScript.ModuleResolutionKind.NodeJs
        && result.options.importHelpers === true
        && result.options.jsx === TypeScript.JsxEmit.React);
});

test('Read tsconfig.json: Valid', async t => {
    const r = await tryReadTypeScriptConfigJson(validFolder);
    t.deepEqual(r, {
        "compilerOptions": {
            "noImplicitAny": false,
            "noImplicitThis": true,
            "alwaysStrict": true,
            "strictNullChecks": false,
            "strictFunctionTypes": false,
            "strictPropertyInitialization": false,
            "skipLibCheck": true,

            "noUnusedLocals": false,
            "noUnusedParameters": false,
            "noImplicitReturns": true,
            "noFallthroughCasesInSwitch": true,

            "experimentalDecorators": true,
            "allowSyntheticDefaultImports": true,
            "resolveJsonModule": true,

            "noEmit": true,
            "target": "es5",
            "module": "esnext",
            "moduleResolution": "node",
            "importHelpers": true,
            "jsx": "react",

            "lib": [
                "dom",
                "es5",
                "es2015.core",
                "es2015.promise",
                "es2015.collection",
                "es2015.reflect",
                "es2016.array.include",
                "es2017.string",
                "es2017.object",
                "es2017.typedarrays",
                "es2018.promise"
            ]
        },
        "exclude": [
            "node_modules"
        ]
    });
});

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

test('Read tsconfig.json: Empty', async t => {
    const r = await tryReadTypeScriptConfigJson(emptyFolder);
    t.deepEqual(r, fallbackTypeScriptConfig);
});

test('Read tsconfig.json: Invalid', async t => {
    const r = await tryReadTypeScriptConfigJson(invalidFolder);
    t.deepEqual(r, fallbackTypeScriptConfig);
});
