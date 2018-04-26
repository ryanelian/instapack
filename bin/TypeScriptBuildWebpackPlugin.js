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
const WorkerFarm = require("worker-farm");
const Shout_1 = require("./Shout");
const jsMinifyWorkerModulePath = require.resolve('./build-workers/JsMinifyWorker');
function createMinificationInput(asset, fileName, sourceMap) {
    let input = {
        payload: {}
    };
    if (sourceMap) {
        let o = asset.sourceAndMap();
        input.code = input.payload[fileName] = o.source;
        input.map = o.map;
        input.options = {
            sourceMap: {
                content: o.map,
            }
        };
    }
    else {
        input.payload[fileName] = asset.source();
    }
    return input;
}
function minifyChunkAssets(compilation, chunks, sourceMap) {
    let jsMinifyWorker = WorkerFarm(jsMinifyWorkerModulePath);
    let tasks = [];
    Shout_1.Shout.timed('TypeScript compile finished! Minifying bundles...');
    for (let chunk of chunks) {
        for (let fileName of chunk.files) {
            let asset = compilation.assets[fileName];
            let input = createMinificationInput(asset, fileName, sourceMap);
            let task = new Promise((ok, reject) => {
                jsMinifyWorker(input, (minifyError, minified) => {
                    if (minifyError) {
                        reject(minifyError);
                    }
                    else {
                        ok(minified);
                    }
                });
            }).then(minified => {
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
            tasks.push(task);
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
