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
const webpack = require("webpack");
const memoryFS = require("memory-fs");
const path = require("path");
const ava_1 = require("ava");
const LoaderPaths_1 = require("./LoaderPaths");
let root = process.cwd();
let fixtures = path.join(root, 'fixtures', 'TemplateLoader');
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
                        test: /\.html?$/,
                        use: [{
                                loader: LoaderPaths_1.LoaderPaths.template,
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
ava_1.default('Template Loader: Simple HTML', (t) => __awaiter(void 0, void 0, void 0, function* () {
    let entry = path.join(fixtures, 'index.html');
    let stats = yield compileAsync(entry);
    let o = stats.toJson();
    if (o.modules) {
        let result = o.modules.filter(Q => Q.source)[0].source;
        t.is(result, 'module.exports = "<div> <h1>Hello World!</h1> </div>"');
    }
    else {
        t.fail('webpack stats.toJson().modules is undefined!');
    }
}));
