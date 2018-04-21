"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_sources_1 = require("webpack-sources");
const UglifyJS = require("uglify-js");
const Shout_1 = require("./Shout");
class TypeScriptBuildWebpackPlugin {
    constructor(options) {
        this.options = options;
    }
    createMinificationInput(asset, fileName) {
        let input = {
            payload: {}
        };
        if (this.options.sourceMap) {
            let o = asset.sourceAndMap();
            input.code = input.payload[fileName] = o.source;
            input.map = o.map;
            input.options = {
                sourceMap: {
                    content: input.map,
                }
            };
        }
        else {
            input.payload[fileName] = asset.source();
        }
        return input;
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
            compilation.hooks.optimizeChunkAssets.tapAsync(pluginId, (chunks, next) => {
                Shout_1.Shout.timed('TypeScript compile finished! Minifying bundles...');
                for (let chunk of chunks) {
                    for (let file of chunk.files) {
                        let asset = compilation.assets[file];
                        let input = this.createMinificationInput(asset, file);
                        let minified = UglifyJS.minify(input.payload, input.options);
                        if (minified.error) {
                            compilation.errors.push(minified.error);
                        }
                        else {
                            let output;
                            if (this.options.sourceMap) {
                                output = new webpack_sources_1.SourceMapSource(minified.code, file, JSON.parse(minified.map), input.code, input.map);
                            }
                            else {
                                output = new webpack_sources_1.RawSource(minified.code);
                            }
                            compilation.assets[file] = output;
                        }
                    }
                }
                next();
            });
        });
    }
}
exports.TypeScriptBuildWebpackPlugin = TypeScriptBuildWebpackPlugin;
