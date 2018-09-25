import chalk from 'chalk';
import webpack = require('webpack');
import { Source, SourceMapSource, RawSource } from 'webpack-sources';

import { Shout } from './Shout';
import { IMinifyWorkerInput } from './workers/IMinifyWorkerInput';
import { runMinifyWorker } from './workers/RunWorker';

/**
* Create required parameters for minifying a compiled asset, as an object.
* @param asset 
* @param fileName 
*/
function createMinificationInput(asset: Source, fileName: string, sourceMap: boolean) {
    let input: IMinifyWorkerInput;

    if (sourceMap) {
        let o = asset.sourceAndMap();
        input = {
            fileName: fileName,
            code: o.source,
            map: o.map as any // HACK78
        }
    } else {
        input = {
            fileName: fileName,
            code: asset.source()
        }
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
    let tasks: Promise<void>[] = [];

    Shout.timed('TypeScript compilation finished! Minifying bundles...');
    for (let chunk of chunks) {
        for (let fileName of chunk.files as string[]) {
            if (fileName.endsWith('js') === false) {
                continue;
            }

            // Shout.timed('Minifying ' + chalk.blue(fileName) + '...');
            let asset = compilation.assets[fileName] as Source;
            let input = createMinificationInput(asset, fileName, sourceMap);

            let t1 = runMinifyWorker(input);
            let t2 = t1.then(minified => {
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
                Shout.warning('Only', chalk.yellow('ES5'), 'modules can be minified! Check',
                    chalk.cyan('tsconfig.json:target'), 'or', chalk.cyan('package.json'), 'dependencies...');
                compilation.errors.push(minifyError);
            });

            tasks.push(t2);
        }
    }

    return Promise.all(tasks);
}

export class TypeScriptBuildMinifyPlugin {
    /**
     * Apply function prototype for registering a webpack plugin.
     * @param compiler 
     */
    apply(compiler: webpack.Compiler) {
        let pluginId = 'typescript-build-minify';

        let enableSourceMaps = false;
        if (compiler.options.devtool) {
            enableSourceMaps = true;
        }

        compiler.hooks.compilation.tap(pluginId, compilation => {
            compilation.hooks.optimizeChunkAssets.tapPromise(pluginId, async chunks => {
                await minifyChunkAssets(compilation, chunks, enableSourceMaps);
            });
        });
    }
}
