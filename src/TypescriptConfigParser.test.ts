import test from "ava";
import * as path from 'path';
import * as TypeScript from 'typescript';
import { parseTypescriptConfig, tryReadTypeScriptConfigJson } from "./TypescriptConfigParser";
import { Shout } from "./Shout";

let root = process.cwd();
let fixtures = path.join(root, 'fixtures');
let validFolder = path.join(fixtures, 'TypeScriptConfigValid');
let emptyFolder = path.join(fixtures, 'TypeScriptConfigEmpty');
let invalidFolder = path.join(fixtures, 'TypeScriptConfigInvalid');

Shout.error = function () { };
Shout.warning = function () { };

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
    let result = parseTypescriptConfig(validFolder, {
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
    let r = await tryReadTypeScriptConfigJson(validFolder);
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

let fallbackTypeScriptConfig = {
    compilerOptions: {
        alwaysStrict: true,
        skipLibCheck: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,

        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        jsx: "react",

        target: "es5",
        module: "esnext",
        moduleResolution: "node",

        lib: [
            "dom",
            "es5",
            "es2015.core",
            "es2015.promise"
        ]
    }
};

test('Read tsconfig.json: Empty', async t => {
    let r = await tryReadTypeScriptConfigJson(emptyFolder);
    t.deepEqual(r, fallbackTypeScriptConfig);
});

test('Read tsconfig.json: Invalid', async t => {
    let r = await tryReadTypeScriptConfigJson(invalidFolder);
    t.deepEqual(r, fallbackTypeScriptConfig);
});
