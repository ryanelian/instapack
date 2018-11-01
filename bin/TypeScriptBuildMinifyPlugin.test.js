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
const MemoryFileSystem = require("memory-fs");
const path = require("path");
const ava_1 = require("ava");
const Typescript = require("typescript");
const TypeScriptBuildMinifyPlugin_1 = require("./TypeScriptBuildMinifyPlugin");
const Shout_1 = require("./Shout");
let root = process.cwd();
let fixtures = path.join(root, 'fixtures');
Shout_1.Shout.error = function () { };
Shout_1.Shout.warning = function () { };
Shout_1.Shout.timed = function () { };
function compileAsync(folderName, ram, languageTarget) {
    return __awaiter(this, void 0, void 0, function* () {
        let folder = path.join(fixtures, folderName);
        let entry = path.join(folder, 'index.js');
        let compiler = webpack({
            context: folder,
            entry: [entry],
            output: {
                filename: 'bundle.js',
                path: folder
            },
            mode: 'production',
            optimization: {
                minimizer: [new TypeScriptBuildMinifyPlugin_1.TypeScriptBuildMinifyPlugin(languageTarget)]
            }
        });
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
ava_1.default('Build Minify Plugin: ES5', (t) => __awaiter(this, void 0, void 0, function* () {
    let ram = new MemoryFileSystem();
    let stats = yield compileAsync('BuildMinifyPluginES5', ram, Typescript.ScriptTarget.ES5);
    let o = stats.toJson();
    let outputPath = path.join(fixtures, 'BuildMinifyPluginES5', 'bundle.js');
    let output = ram.readFileSync(outputPath, 'utf8');
    let isMinified = output.includes('abc123') && output.includes('\n') === false;
    t.true(isMinified);
}));
ava_1.default('Build Minify Plugin: ES2015 targeting ES5 Error', (t) => __awaiter(this, void 0, void 0, function* () {
    let ram = new MemoryFileSystem();
    let stats = yield compileAsync('BuildMinifyPluginES2015', ram, Typescript.ScriptTarget.ES5);
    let o = stats.toJson();
    let err = 'Unexpected token: keyword (const)';
    t.is(o.errors[0], err);
}));
ava_1.default('Build Minify Plugin: ES2015', (t) => __awaiter(this, void 0, void 0, function* () {
    let ram = new MemoryFileSystem();
    let stats = yield compileAsync('BuildMinifyPluginES2015', ram, Typescript.ScriptTarget.ES2015);
    let o = stats.toJson();
    let outputPath = path.join(fixtures, 'BuildMinifyPluginES2015', 'bundle.js');
    let output = ram.readFileSync(outputPath, 'utf8');
    let isMinified = output.includes('abc123') && output.includes('\n') === false;
    t.true(isMinified);
}));
