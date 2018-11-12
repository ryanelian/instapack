import chalk from 'chalk';
import webpack = require('webpack');
import * as TypeScript from 'typescript';
import { Source, SourceMapSource, RawSource } from 'webpack-sources';

import { Shout } from './Shout';
import { IMinifyWorkerInput } from './workers/IMinifyWorkerInput';
import { runMinifyWorker } from './workers/RunWorker';

/**
* Create required parameters for minifying a compiled asset, as an object.
* @param asset 
* @param fileName 
*/
function createMinificationInput(asset: Source, fileName: string, sourceMap: boolean, ecma: number) {
    let input: IMinifyWorkerInput;

    if (sourceMap) {
        let o = asset.sourceAndMap();
        input = {
            fileName: fileName,
            code: o.source,
            ecma: ecma,
            map: o.map as any // HACK78
        }
    } else {
        input = {
            fileName: fileName,
            ecma: ecma,
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
function minifyChunkAssets(compilation: webpack.compilation.Compilation,
    chunks: webpack.compilation.Chunk[],
    sourceMap: boolean,
    ecma: number) {
    let tasks: Promise<void>[] = [];

    Shout.timed('TypeScript compilation finished! Minifying bundles...');
    for (let chunk of chunks) {
        // console.log(chunk.hasEntryModule());
        // console.log(chunk.files);

        for (let fileName of chunk.files as string[]) {
            if (fileName.endsWith('js') === false) {
                continue;
            }

            // Shout.timed('Minifying ' + chalk.blue(fileName) + '...');
            let asset = compilation.assets[fileName] as Source;
            let input = createMinificationInput(asset, fileName, sourceMap, ecma);

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
                if (ecma === 5) {
                    if (chunk.hasEntryModule() === false) {
                        Shout.warning('Project is targeting', chalk.yellow('ES5'),
                            'but one or more dependencies in', chalk.cyan('package.json'),
                            'might be ES2015+');
                    } else {
                        Shout.warning('Possible TypeScript bug: ES5-transpiled project contains ES2015+ output?!');
                    }
                }
                compilation.errors.push(minifyError);
            });

            tasks.push(t2);
        }
    }

    return Promise.all(tasks);
}

export class TypeScriptBuildMinifyPlugin {

    private ecma: number = 5;

    constructor(languageTarget: TypeScript.ScriptTarget) {
        if (languageTarget === TypeScript.ScriptTarget.ES3 || languageTarget === TypeScript.ScriptTarget.ES5) {
            this.ecma = 5;
        } else if (languageTarget === TypeScript.ScriptTarget.ES2015) {
            this.ecma = 6;
        } else if (languageTarget === TypeScript.ScriptTarget.ES2016) {
            this.ecma = 7;
        } else {
            this.ecma = 8;
        }
    }

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
                await minifyChunkAssets(compilation, chunks, enableSourceMaps, this.ecma);
            });
        });
    }
}
