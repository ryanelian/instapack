"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
ava_1.default('Read tsconfig.json: Valid', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const r = yield TypescriptConfigParser_1.tryReadTypeScriptConfigJson(validFolder);
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
}));
const fallbackTypeScriptConfig = {
    compilerOptions: {
        alwaysStrict: true,
        skipLibCheck: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        jsx: "react",
        target: "es2016",
        module: "esnext",
        moduleResolution: "node",
        lib: [
            "dom",
            "es2016",
            "dom.iterable"
        ]
    }
};
ava_1.default('Read tsconfig.json: Empty', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const r = yield TypescriptConfigParser_1.tryReadTypeScriptConfigJson(emptyFolder);
    t.deepEqual(r, fallbackTypeScriptConfig);
}));
ava_1.default('Read tsconfig.json: Invalid', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const r = yield TypescriptConfigParser_1.tryReadTypeScriptConfigJson(invalidFolder);
    t.deepEqual(r, fallbackTypeScriptConfig);
}));
