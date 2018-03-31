import chalk from 'chalk';
import { Compiler } from 'webpack';
import { Source, SourceMapSource, RawSource } from 'webpack-sources';
import { RawSourceMap } from 'source-map';
import * as UglifyJS from 'uglify-js';

import { Shout } from './Shout';

/**
 * Options required for TypeScriptBuildWebpackPlugin to function, collected from Settings and ICompilerFlags.
 */
interface ITypeScriptBuildWebpackPluginOptions {
    jsEntry: string;
    target: string;
    production: boolean;
    sourceMap: boolean;
}

/**
 * Values required for operating UglifyJS 3 and webpack-sources, collected into an object.
 */
interface IMinificationInput {
    code?: string;
    map?: RawSourceMap;
    payload: { [file: string]: string };
    options?;
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
     * Create required parameters for Uglify-ing a compiled asset, as an object.
     * @param asset 
     * @param fileName 
     */
    createMinificationInput(asset: Source, fileName: string) {
        let input: IMinificationInput = {
            payload: {}
        };

        if (this.options.sourceMap) {
            let o = asset.sourceAndMap();
            input.code = input.payload[fileName] = o.source;
            input.map = o.map as any; // HACK78
            input.options = {
                sourceMap: {
                    content: input.map,
                    // url: fileName + '.map'
                }
            }
        } else {
            input.payload[fileName] = asset.source();
        }

        return input;
    }

    /**
     * Apply function prototype for registering a webpack plugin.
     * @param compiler 
     */
    apply(compiler: Compiler) {
        if (this.options.target !== 'ES5') {
            Shout.danger('TypeScript compile target is not', chalk.yellow('ES5'), '!' + chalk.grey('(tsconfig.json)'));
        }

        compiler.plugin('compile', compilation => {
            Shout.timed('Compiling JS >', chalk.yellow(this.options.target), chalk.cyan(this.options.jsEntry));
        });

        if (!this.options.production) {
            return;
        }

        compiler.plugin('compilation', compilation => {
            compilation.plugin('optimize-chunk-assets', (chunks, next) => {
                for (let chunk of chunks) {
                    for (let file of chunk.files) {
                        let asset = compilation.assets[file] as Source;
                        let input = this.createMinificationInput(asset, file);
                        let minified = UglifyJS.minify(input.payload, input.options);

                        if (minified.error) {
                            compilation.errors.push(minified.error);
                        } else {
                            let output;
                            if (this.options.sourceMap) {
                                // HACK78
                                output = new SourceMapSource(minified.code, file, JSON.parse(minified.map), input.code, input.map as any);
                            } else {
                                output = new RawSource(minified.code);
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
