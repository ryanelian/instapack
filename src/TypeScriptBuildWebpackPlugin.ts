import chalk from 'chalk';
import * as webpack from 'webpack';
import { Source, SourceMapSource, RawSource } from 'webpack-sources';
import { RawSourceMap } from 'source-map';
import * as WorkerFarm from 'worker-farm';
import { Shout } from './Shout';

import { MinifyOutput } from 'uglify-js';
import { IMinifyInputs } from './IMinifyInputs';

const jsMinifyWorkerModulePath = require.resolve('./build-workers/JsMinifyWorker');

/**
 * Options required for TypeScriptBuildWebpackPlugin to function, collected from Settings and ICompilerFlags.
 */
interface ITypeScriptBuildWebpackPluginOptions {
    onBuildStart: () => any;
    minify: boolean;
    sourceMap: boolean;
}

/**
* Create required parameters for minifying a compiled asset, as an object.
* @param asset 
* @param fileName 
*/
function createMinificationInput(asset: Source, fileName: string, sourceMap: boolean) {
    let input: IMinifyInputs = {
        payload: {}
    };

    if (sourceMap) {
        let o = asset.sourceAndMap();
        input.code = input.payload[fileName] = o.source;
        input.map = o.map as any; // HACK78
        input.options = {
            sourceMap: {
                content: o.map,
                // url: fileName + '.map'
            }
        }
    } else {
        input.payload[fileName] = asset.source();
    }

    return input;
}

/**
 * Returns a Promise object which resolves when all chunk assets minification jobs in background workers have finished.
 * @param compilation 
 * @param chunks 
 * @param sourceMap 
 */
function minifyChunkAssets(compilation: webpack.compilation.Compilation, chunks: webpack.compilation.Chunk[], sourceMap: boolean) {
    let jsMinifyWorker = WorkerFarm(jsMinifyWorkerModulePath);
    let tasks: Promise<void>[] = [];

    Shout.timed('TypeScript compile finished! Minifying bundles...');
    for (let chunk of chunks) {
        for (let fileName of chunk.files as string[]) {
            // Shout.timed('Minifying ' + chalk.blue(fileName) + '...');
            let asset = compilation.assets[fileName] as Source;
            let input = createMinificationInput(asset, fileName, sourceMap);

            let task = new Promise<MinifyOutput>((ok, reject) => {
                jsMinifyWorker(input, (minifyError, minified: MinifyOutput) => {
                    if (minifyError) {
                        reject(minifyError);
                    } else {
                        ok(minified);
                    }
                });
            }).then(minified => {
                let output: Source;
                if (sourceMap) {
                    output = new SourceMapSource(minified.code, fileName, JSON.parse(minified.map),
                        input.code, input.map as any);  // HACK78
                } else {
                    output = new RawSource(minified.code);
                }
                compilation.assets[fileName] = output;
            }).catch(minifyError => {
                Shout.error(`when minifying ${chalk.blue(fileName)} during JS build:`, minifyError);
                compilation.errors.push(minifyError);
            });

            tasks.push(task);
        }
    }

    return Promise.all(tasks);
}

/**
 * Custom webpack plugin for managing TypeScript build lifecycle. 
 */
export class TypeScriptBuildWebpackPlugin {

    /**
     * Gets the options required for TypeScriptBuildWebpackPlugin to function.
     */
    private readonly options: ITypeScriptBuildWebpackPluginOptions;

    /**
     * Constructs a new instance of TypeScriptBuildWebpackPlugin using its options. 
     * @param options 
     */
    constructor(options: ITypeScriptBuildWebpackPluginOptions) {
        this.options = options;
    }

    /**
     * Apply function prototype for registering a webpack plugin.
     * @param compiler 
     */
    apply(compiler: webpack.Compiler) {
        let pluginId = 'typescript-build';

        compiler.hooks.compile.tap(pluginId, compilation => {
            this.options.onBuildStart();
        });

        if (!this.options.minify) {
            return;
        }

        compiler.hooks.compilation.tap(pluginId, compilation => {
            compilation.hooks.optimizeChunkAssets.tapAsync(pluginId, async (chunks, next) => {
                await minifyChunkAssets(compilation, chunks, this.options.sourceMap);
                next();
            });
        });
    }
}
