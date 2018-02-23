import chalk from 'chalk';
import { Compiler } from 'webpack';
import { Source, SourceMapSource, RawSource } from 'webpack-sources';
import { RawSourceMap } from 'source-map';
let Uglify = require('uglify-js');

import { Settings } from './Settings';
import { timedLog, CompilerFlags } from './CompilerUtilities';
import { getTypeScriptTarget } from './TypeScriptConfigurationReader';

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
     * Gets the project settings.
     */
    private readonly settings: Settings;

    /**
     * Gets the compiler build flags.
     */
    private readonly flags: CompilerFlags;

    /**
     * Constructs a new instance of TypeScriptBuildPlugin using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(settings: Settings, flags: CompilerFlags) {
        this.settings = settings
        this.flags = flags;
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

        if (this.flags.sourceMap) {
            let o = asset.sourceAndMap();
            input.code = input.payload[fileName] = o.source;
            input.map = o.map as any;
            input.options = {
                sourceMap: {
                    content: input.map,
                    url: fileName + '.map'
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
        let tsTarget = getTypeScriptTarget();
        if (tsTarget !== 'ES5') {
            console.warn(chalk.red('DANGER') + ' TypeScript compile target is not ' + chalk.yellow('ES5') + '! ' + chalk.grey('(tsconfig.json)'));
        }

        compiler.plugin('compile', compilation => {
            timedLog('Compiling JS >', chalk.yellow(tsTarget), chalk.cyan(this.settings.jsEntry));
        });

        if (!this.flags.production) {
            return;
        }

        compiler.plugin('compilation', compilation => {
            compilation.plugin('optimize-chunk-assets', (chunks, next) => {
                for (let chunk of chunks) {
                    for (let file of chunk.files) {
                        let asset = compilation.assets[file] as Source;
                        let input = this.createMinificationInput(asset, file);
                        let minified = Uglify.minify(input.payload, input.options);

                        if (minified.error) {
                            compilation.errors.push(minified.error);
                        } else {
                            let output;
                            if (this.flags.sourceMap) {
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
