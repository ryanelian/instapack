"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const typescript_1 = __importDefault(require("typescript"));
const TypescriptConfigParser_1 = require("./TypescriptConfigParser");
ava_1.default.only('Parse TypeScript Configuration: Error', t => {
    t.throws(() => {
        TypescriptConfigParser_1.parseTypescriptConfig(process.cwd(), {
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
ava_1.default.only('Parse TypeScript Configuration: OK', t => {
    let result = TypescriptConfigParser_1.parseTypescriptConfig(process.cwd(), {
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
    t.true(result.options.alwaysStrict === true
        && result.options.skipLibCheck === true
        && result.options.noImplicitReturns === true
        && result.options.noFallthroughCasesInSwitch === true
        && result.options.noEmit === true
        && result.options.target === typescript_1.default.ScriptTarget.ES5
        && result.options.module === typescript_1.default.ModuleKind.ESNext
        && result.options.moduleResolution === typescript_1.default.ModuleResolutionKind.NodeJs
        && result.options.importHelpers === true
        && result.options.jsx === typescript_1.default.JsxEmit.React);
});
