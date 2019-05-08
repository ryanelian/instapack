"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const webpack = require("webpack");
const memoryFS = require("memory-fs");
const path = require("path");
const TypescriptConfigParser_1 = require("../TypescriptConfigParser");
const ava_1 = require("ava");
const LoaderPaths_1 = require("./LoaderPaths");
let root = process.cwd();
let fixtures = path.join(root, 'fixtures', 'CoreTypeScriptLoader');
let tsconfigJson = {
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
let tsconfig = TypescriptConfigParser_1.parseTypescriptConfig(fixtures, tsconfigJson);
function compileAsync(entry) {
    return __awaiter(this, void 0, void 0, function* () {
        let compiler = webpack({
            context: fixtures,
            entry: [entry],
            output: {
                filename: 'bundle.js',
                path: fixtures
            },
            module: {
                rules: [{
                        test: /\.tsx?$/,
                        use: [{
                                loader: LoaderPaths_1.LoaderPaths.typescript,
                                options: {
                                    compilerOptions: tsconfig.options
                                }
                            }]
                    }]
            },
            resolve: {
                extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs']
            },
            mode: 'development'
        });
        let ram = new memoryFS();
        compiler.outputFileSystem = ram;
        return yield new Promise((ok, reject) => {
            compiler.run((err, stats) => {
                if (err) {
                    reject(err);
                }
                ok(stats);
            });
        });
    });
}
ava_1.default('Core TypeScript Loader: ES5', (t) => __awaiter(this, void 0, void 0, function* () {
    let entry = path.join(fixtures, 'index.ts');
    let stats = yield compileAsync(entry);
    let o = stats.toJson();
    if (o.modules) {
        let result = o.modules.filter(Q => Q.source)[0].source;
        if (result) {
            result = result.replace(/\r/g, '');
        }
        t.is(result, '"use strict";\nvar foo = function (bar) {\n    return bar.length;\n};\nvar x = foo(\'abcd\');\n');
    }
    else {
        t.fail('webpack stats.toJson().modules is undefined!');
    }
}));
