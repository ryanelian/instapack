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
const chalk_1 = require("chalk");
const webpack_sources_1 = require("webpack-sources");
const Shout_1 = require("./Shout");
const CompilerUtilities_1 = require("./CompilerUtilities");
const jsMinifyWorkerModulePath = require.resolve('./build-workers/JsMinifyWorker');
function createMinificationInput(asset, fileName, sourceMap) {
    let input;
    if (sourceMap) {
        let o = asset.sourceAndMap();
        input = {
            fileName: fileName,
            code: o.source,
            map: o.map
        };
    }
    else {
        input = {
            fileName: fileName,
            code: asset.source()
        };
    }
    return input;
}
function minifyChunkAssets(compilation, chunks, sourceMap) {
    let tasks = [];
    Shout_1.Shout.timed('TypeScript compile finished! Minifying bundles...');
    for (let chunk of chunks) {
        for (let fileName of chunk.files) {
            if (fileName.endsWith('js') === false) {
                continue;
            }
            let asset = compilation.assets[fileName];
            let input = createMinificationInput(asset, fileName, sourceMap);
            let t1 = CompilerUtilities_1.runWorkerAsync(jsMinifyWorkerModulePath, input);
            let t2 = t1.then(minified => {
                let output;
                if (sourceMap) {
                    output = new webpack_sources_1.SourceMapSource(minified.code, fileName, JSON.parse(minified.map), input.code, input.map);
                }
                else {
                    output = new webpack_sources_1.RawSource(minified.code);
                }
                compilation.assets[fileName] = output;
            }).catch(minifyError => {
                Shout_1.Shout.error(`when minifying ${chalk_1.default.blue(fileName)} during JS build:`, minifyError);
                compilation.errors.push(minifyError);
            });
            tasks.push(t2);
        }
    }
    return Promise.all(tasks);
}
class TypeScriptBuildWebpackPlugin {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        let pluginId = 'typescript-build';
        compiler.hooks.compile.tap(pluginId, compilation => {
            this.options.onBuildStart();
        });
        if (!this.options.minify) {
            return;
        }
        compiler.hooks.compilation.tap(pluginId, compilation => {
            compilation.hooks.optimizeChunkAssets.tapAsync(pluginId, (chunks, next) => __awaiter(this, void 0, void 0, function* () {
                yield minifyChunkAssets(compilation, chunks, this.options.sourceMap);
                next();
            }));
        });
    }
}
exports.TypeScriptBuildWebpackPlugin = TypeScriptBuildWebpackPlugin;
