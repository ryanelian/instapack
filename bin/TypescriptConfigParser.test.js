"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const path_1 = __importDefault(require("path"));
const typescript_1 = __importDefault(require("typescript"));
const TypescriptConfigParser_1 = require("./TypescriptConfigParser");
const Shout_1 = require("./Shout");
let root = process.cwd();
let fixtures = path_1.default.join(root, 'fixtures');
let validFolder = path_1.default.join(fixtures, 'TypeScriptConfigValid');
let emptyFolder = path_1.default.join(fixtures, 'TypeScriptConfigEmpty');
let invalidFolder = path_1.default.join(fixtures, 'TypeScriptConfigInvalid');
Shout_1.Shout.error = function () { };
Shout_1.Shout.warning = function () { };
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
    let result = TypescriptConfigParser_1.parseTypescriptConfig(validFolder, {
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
        && result.options.target === typescript_1.default.ScriptTarget.ES5
        && result.options.module === typescript_1.default.ModuleKind.ESNext
        && result.options.moduleResolution === typescript_1.default.ModuleResolutionKind.NodeJs
        && result.options.importHelpers === true
        && result.options.jsx === typescript_1.default.JsxEmit.React);
});
ava_1.default('Read tsconfig.json: Valid', (t) => __awaiter(this, void 0, void 0, function* () {
    let r = yield TypescriptConfigParser_1.tryReadTypeScriptConfigJson(validFolder);
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
ava_1.default('Read tsconfig.json: Empty', (t) => __awaiter(this, void 0, void 0, function* () {
    let r = yield TypescriptConfigParser_1.tryReadTypeScriptConfigJson(emptyFolder);
    t.deepEqual(r, fallbackTypeScriptConfig);
}));
ava_1.default('Read tsconfig.json: Invalid', (t) => __awaiter(this, void 0, void 0, function* () {
    let r = yield TypescriptConfigParser_1.tryReadTypeScriptConfigJson(invalidFolder);
    t.deepEqual(r, fallbackTypeScriptConfig);
}));
