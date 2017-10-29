import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import * as webpack from 'webpack';
import * as ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import * as UglifyWebpackPlugin from 'uglifyjs-webpack-plugin';

import { timedLog, CompilerFlags } from './CompilerUtilities';
import { Settings } from './Settings';
import { createUglifyESOptions } from './TypeScriptOptionsReader';
import { prettyBytes, prettyMilliseconds } from './PrettyUnits';

/**
 * Contains methods for compiling a TypeScript project.
 */
export class TypeScriptBuildTool {

    /**
     * Gets the project settings.
     */
    private readonly settings: Settings;

    /**
     * Gets the compiler build flags.
     */
    private readonly flags: CompilerFlags;

    /**
     * Constructs a new instance of TypeScriptBuildTool using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(settings: Settings, flags: CompilerFlags) {
        this.settings = settings
        this.flags = flags;
    }

    /**
     * Returns a pre-configured loader array with optional cache and parallel capability.
     * @param cached 
     */
    getParallelLoaders(cached: boolean) {
        let loaders = [];

        if (this.flags.parallel) {
            if (cached) {
                loaders.push({
                    loader: 'cache-loader',
                    options: {
                        cacheDirectory: this.settings.cacheFolder
                    }
                });
            }

            loaders.push({
                loader: 'thread-loader',
                options: {
                    workers: os.cpus().length - 1
                }
            });
        }

        return loaders;
    }

    /**
     * Returns a configured TypeScript rules for webpack.
     */
    getTypeScriptWebpackRules() {
        let loaders = this.getParallelLoaders(true);

        loaders.push({
            loader: 'ts-loader',
            options: {
                compilerOptions: {
                    noEmit: false,
                    sourceMap: this.flags.sourceMap,
                    moduleResolution: "node"
                },
                onlyCompileBundledFiles: true,
                transpileOnly: this.flags.parallel,
                happyPackMode: this.flags.parallel
            }
        });

        // loaders.push({
        //     loader: 'turbo-typescript-loader'
        // });

        return {
            test: /\.tsx?$/,
            use: loaders
        };
    }

    /**
     * Returns a configured HTML template rules for webpack.
     */
    getTemplatesWebpackRules() {
        let loaders = this.getParallelLoaders(false);

        loaders.push({
            loader: 'template-loader',
            options: {
                mode: this.settings.template
            }
        });

        return {
            test: /\.html?$/,
            use: loaders
        };
    }

    /**
     * Returns a configured webpack plugins.
     */
    getWebpackPlugins() {
        let plugins = [];
        plugins.push(new webpack.NoEmitOnErrorsPlugin());

        if (this.flags.parallel) {
            plugins.push(new ForkTsCheckerWebpackPlugin({
                checkSyntacticErrors: true,
                async: false,
                silent: true,
                watch: this.settings.inputJsFolder
            }));
        }

        if (this.flags.production) {
            plugins.push(new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify('production')
                }
            }));
            plugins.push(new UglifyWebpackPlugin({
                sourceMap: this.flags.sourceMap,
                parallel: this.flags.parallel,
                uglifyOptions: createUglifyESOptions()
            }));
        }

        return plugins;
    }

    /**
     * Gets a webpack configuration from blended instapack configuration and build flags.
     */
    get webpackConfiguration() {
        let config: webpack.Configuration = {
            entry: this.settings.jsEntry,
            output: {
                filename: this.settings.jsOut,
                path: this.settings.outputJsFolder
            },
            externals: this.settings.externals,
            resolve: {
                extensions: ['.js', '.ts', '.tsx', '.htm', '.html'],
                alias: this.settings.alias
            },
            resolveLoader: {
                modules: [
                    path.resolve(__dirname, 'loaders'),         // custom internal loaders
                    path.resolve(__dirname, '../node_modules'), // local node_modules
                    path.resolve(__dirname, '..', '..'),        // yarn's flat global node_modules
                ]
            },
            module: {
                rules: [this.getTypeScriptWebpackRules(), this.getTemplatesWebpackRules()]
            },
            plugins: this.getWebpackPlugins()
        };

        if (this.flags.sourceMap) {
            config.devtool = (this.flags.production ? 'source-map' : 'eval-source-map');
        }

        if (this.flags.watch) {
            config.watch = true;
            config.watchOptions = {
                ignored: /node_modules/,
                aggregateTimeout: 300
            };
        }

        return config;
    }

    /**
     * Gets webpack stat render options for colored warnings and errors.
     */
    get webpackStatsErrorsOnly() {
        return {
            colors: true,
            assets: false,
            cached: false,
            children: false,
            chunks: false,
            errors: true,
            hash: false,
            modules: false,
            reasons: false,
            source: false,
            timings: false,
            version: false,
            warnings: true
        } as webpack.Stats.ToStringOptions;
    }

    /**
     * Gets webpack stat extraction options for assets and build time only.  
     */
    get webpackStatsJsonMinimal() {
        return {
            assets: true,
            cached: false,
            children: false,
            chunks: false,
            errors: false,
            hash: false,
            modules: false,
            reasons: false,
            source: false,
            timings: true,
            version: false,
            warnings: false
        } as webpack.Stats.ToJsonOptions;
    }

    /**
     * Runs the TypeScript build engine.
     */
    build() {
        webpack(this.webpackConfiguration, (error, stats) => {
            if (error) {
                timedLog(chalk.red('FATAL ERROR'), 'during JS build:');
                console.error(error);
                return;
            }

            let o = stats.toJson(this.webpackStatsJsonMinimal);

            if (stats.hasErrors() || stats.hasWarnings()) {
                console.log(stats.toString(this.webpackStatsErrorsOnly));
            }

            for (let asset of o.assets) {
                if (asset.emitted) {
                    let kb = prettyBytes(asset.size);
                    timedLog(chalk.blue(asset.name), chalk.magenta(kb));
                }
            }

            let t = prettyMilliseconds(o.time);
            timedLog('Finished JS build after', chalk.green(t));
        });
    }
}
