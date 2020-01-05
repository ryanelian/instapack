"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const path = require("path");
const TypeScript = require("typescript");
const TypescriptConfigParser_1 = require("./TypescriptConfigParser");
const root = process.cwd();
const fixtures = path.join(root, 'fixtures');
const validFolder = path.join(fixtures, 'TypeScriptConfigValid');
const emptyFolder = path.join(fixtures, 'TypeScriptConfigEmpty');
const invalidFolder = path.join(fixtures, 'TypeScriptConfigInvalid');
ava_1.default.before(() => {
    global.console.log = () => { };
    global.console.error = () => { };
    global.console.warn = () => { };
});
ava_1.default('Parse TypeScript Configuration: Error', t => {
    t.throws(() => {
        TypescriptConfigParser_1.parseTypescriptConfig(validFolder, {
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
ava_1.default('Parse TypeScript Configuration: OK', t => {
    const result = TypescriptConfigParser_1.parseTypescriptConfig(validFolder, {
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
    t.true(result.options.noImplicitAny === false
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
ava_1.default('Read tsconfig.json: Valid', async (t) => {
    const r = await TypescriptConfigParser_1.tryReadTypeScriptConfigJson(validFolder);
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
        "target": "ES2015",
        "module": "ESNext",
        "lib": [
            "DOM",
            "DOM.Iterable",
            "ES2015",
        ],
        "resolveJsonModule": true,
        "jsx": "react",
        "importHelpers": false,
        "strict": true,
        "noImplicitAny": false,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "moduleResolution": "node",
        "allowSyntheticDefaultImports": true,
        "experimentalDecorators": true,
        "forceConsistentCasingInFileNames": true,
        "skipLibCheck": true
    }
};
ava_1.default('Read tsconfig.json: Empty', async (t) => {
    const r = await TypescriptConfigParser_1.tryReadTypeScriptConfigJson(emptyFolder);
    t.deepEqual(r, fallbackTypeScriptConfig);
});
ava_1.default('Read tsconfig.json: Invalid', async (t) => {
    const r = await TypescriptConfigParser_1.tryReadTypeScriptConfigJson(invalidFolder);
    t.deepEqual(r, fallbackTypeScriptConfig);
});
