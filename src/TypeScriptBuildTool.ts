import * as path from 'path';
import * as fse from 'fs-extra';
import chalk from 'chalk';
import * as webpack from 'webpack';
import * as TypeScript from 'typescript';
import { VueLoaderPlugin } from 'vue-loader';

import hub from './EventHub';
import { ICompilerFlags } from './CompilerUtilities';
import { Settings } from './Settings';
import { prettyBytes, prettyMilliseconds } from './PrettyUnits';
import { TypeScriptBuildWebpackPlugin } from './TypeScriptBuildWebpackPlugin';
import { Shout } from './Shout';

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
    private readonly flags: ICompilerFlags;

    /**
     * Gets the TypeScript compiler options. (Read once and cache.)
     */
    private readonly tsconfigOptions: TypeScript.CompilerOptions;

    /**
     * Constructs a new instance of TypeScriptBuildTool using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(settings: Settings, flags: ICompilerFlags) {
        this.settings = settings
        this.flags = flags;

        this.tsconfigOptions = this.settings.readTsConfig().options;
        this.mergeTypeScriptPathsToWebpackAlias();
    }

    /**
     * Translates tsconfig.json paths into webpack-compatible aliases!
     */
    mergeTypeScriptPathsToWebpackAlias() {
        if (!this.tsconfigOptions.paths) {
            return;
        }

        if (!this.tsconfigOptions.baseUrl) {
            Shout.warning(chalk.cyan('tsconfig.json'), 'paths are defined, but baseUrl is not!');
            return;
        }

        for (let key in this.tsconfigOptions.paths) {
            let originalKey = key;

            // not going support this anti-pattern: it mixes package and project file namespaces. Dirty AF!
            if (key === '*') {
                Shout.warning(chalk.cyan('tsconfig.json'), 'paths:', chalk.yellow(key), 'is not supported!');
                continue;
            }

            // technical limitation: 1 alias = 1 path, not multiple paths...
            let values = this.tsconfigOptions.paths[key];
            if (values.length > 1) {
                Shout.warning(chalk.cyan('tsconfig.json'),
                    'paths:', chalk.yellow(key), 'resolves to more than one path!',
                    chalk.grey('(Only the first will be honored.)')
                );
            }

            let value = values[0];
            if (!value) {
                Shout.warning(chalk.cyan('tsconfig.json'), 'paths:', chalk.yellow(key), 'is empty!');
                continue;
            }

            // webpack alias does wildcard resolution automatically.
            let wildcard = false;
            if (key.endsWith('/*')) {
                wildcard = true;
                key = key.substr(0, key.length - 2);
            }

            if (value.endsWith('/*')) {
                value = value.substr(0, value.length - 2);
            } else {
                if (wildcard) {
                    Shout.warning(chalk.cyan('tsconfig.json'),
                        'paths:', chalk.yellow(originalKey), 'is a wildcard but its value is not!',
                        chalk.grey('(Resolves to index.ts)')
                    );
                }
            }

            // don't let the merge overrides user-defined aliases!
            if (!this.settings.alias[key]) {
                this.settings.alias[key] = path.resolve(this.settings.root, this.tsconfigOptions.baseUrl, value);
                // console.log(key, " ", value);
            }
        }
    }

    /**
     * Gets a configured TypeScript rules for webpack.
     */
    get typescriptWebpackRules() {
        let options = this.tsconfigOptions;
        options.sourceMap = this.flags.sourceMap;
        options.inlineSources = this.flags.sourceMap;

        return {
            test: /\.tsx?$/,
            use: [{
                loader: 'core-typescript-loader',
                options: {
                    compilerOptions: options
                }
            }]
        };
    }

    /**
     * Gets a Vue Single-File Component rule for webpack.
     */
    get vueWebpackRules() {
        return {
            test: /\.vue$/,
            use: [{
                loader: 'vue-loader',
                options: {
                    transformAssetUrls: {},     // remove <img> src and SVG <image> xlink:href resolution
                }
            }]
        }
    }

    /**
     * Gets a configured HTML template rules for webpack.
     */
    get templatesWebpackRules() {
        return {
            test: /\.html$/,
            use: [{
                loader: 'template-loader'
            }]
        };
    }

    /**
     * Gets CSS rules for webpack to prevent explosion during vue compile.
     */
    get cssWebpackRules() {
        // <style module> IS NOT SUPPORTED BECAUSE css-loader TEAM PLANS TO REMOVE module OPTION!
        //  https://github.com/webpack-contrib/css-loader/issues/509
        return {
            test: /\.css$/,
            use: [
                {
                    loader: 'vue-style-loader'
                }, {
                    loader: 'css-loader',
                    options: {
                        url: false
                    }
                }
            ]
        }
    }

    /**
     * A simple flag to prevent instapack screaming about unsupported TypeScript build target twice. 
     */
    buildTargetWarned = false;

    /**
     * Chat to CLI user on build start. 
     */
    onBuildStart() {
        let t = this.tsconfigOptions.target;
        if (!t) {
            t = TypeScript.ScriptTarget.ES3;
        }
        let buildTarget = TypeScript.ScriptTarget[t].toUpperCase();

        if (buildTarget !== 'ES5' && !this.buildTargetWarned) {
            Shout.danger('TypeScript compile target is not', chalk.yellow('ES5') + '!', chalk.grey('(tsconfig.json)'));
            this.buildTargetWarned = true;
        }
        Shout.timed('Compiling', chalk.cyan('index.ts'),
            '>', chalk.yellow(buildTarget),
            chalk.grey('in ' + this.settings.inputJsFolder + '/')
        );
    }

    /**
     * Returns a configured webpack plugins.
     */
    getWebpackPlugins() {
        let plugins = [];

        plugins.push(new TypeScriptBuildWebpackPlugin({
            onBuildStart: this.onBuildStart.bind(this),
            minify: this.flags.production,
            sourceMap: this.flags.sourceMap
        }));

        plugins.push(new VueLoaderPlugin());
        return plugins;
    }

    /**
     * Gets a webpack configuration from blended instapack configuration and build flags.
     */
    get webpackConfiguration() {
        // for some very odd reasons, webpack requires Windows path format (on Windows) as parameters...
        let config: webpack.Configuration = {
            entry: path.normalize(this.settings.jsEntry),
            output: {
                filename: this.settings.jsOut,
                chunkFilename: this.settings.jsChunkFileName,   // https://webpack.js.org/guides/code-splitting
                path: path.normalize(this.settings.outputJsFolder),
                publicPath: 'js/'   // yay for using "js" folder in output!
            },
            externals: this.settings.externals,
            resolve: {
                extensions: ['.ts', '.tsx', '.js', '.mjs', '.wasm', '.json', '.vue', '.html'],
                // .mjs causes runtime error when `module.exports` is being used instead of `export`.
                // .wasm requires adding `application/wasm` MIME to web server (both IIS and Kestrel).
                alias: this.settings.alias
            },
            resolveLoader: {
                modules: [
                    path.resolve(__dirname, 'loaders'),             // custom internal loaders
                    path.resolve(__dirname, '../node_modules'),     // local node_modules
                    path.resolve(__dirname, '..', '..'),            // yarn's flat global node_modules
                ]
            },
            module: {
                rules: [
                    this.typescriptWebpackRules,
                    this.templatesWebpackRules,
                    this.vueWebpackRules,
                    this.cssWebpackRules
                ]
            },
            mode: (this.flags.production ? 'production' : 'development'),
            devtool: (this.flags.production ? 'source-map' : 'eval-source-map'),
            optimization: {
                minimize: false,        // https://medium.com/webpack/webpack-4-mode-and-optimization-5423a6bc597a
                noEmitOnErrors: true,   // https://dev.to/flexdinesh/upgrade-to-webpack-4---5bc5
                splitChunks: {          // https://webpack.js.org/plugins/split-chunks-plugin/
                    cacheGroups: {
                        vendors: {
                            name: 'dll',
                            test: /[\\/]node_modules[\\/]/,
                            chunks: 'all',
                            enforce: true,
                            priority: -10
                        }
                    }
                }
            },
            performance: {
                hints: false    // https://webpack.js.org/configuration/performance
            },
            plugins: this.getWebpackPlugins()
        };

        if (!this.flags.sourceMap) {
            config.devtool = false;
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
     * Get stat objects required for instapack build logs.
     */
    get statsSerializeEssentialOption(): webpack.Stats.ToJsonOptions {
        return {
            assets: true,
            cached: false,
            cachedAssets: false,
            children: false,
            chunkModules: false,
            chunkOrigins: false,
            chunks: false,
            depth: false,
            entrypoints: false,
            env: false,
            errors: true,
            errorDetails: false,
            hash: false,
            modules: false,
            moduleTrace: true,
            publicPath: false,
            reasons: false,
            source: false,
            timings: true,
            version: false,
            warnings: true,
            usedExports: false,
            performance: false,
            providedExports: false
        };
    }

    /**
     * Runs the TypeScript build engine. Automatically exits process if not in watch mode.
     */
    build() {
        webpack(this.webpackConfiguration, (error, stats) => {
            if (error) {
                Shout.fatal('during JS build (tool):', error);
                Shout.notify('FATAL ERROR during JS build!');
                hub.buildDone();
                return;
            }

            let o = stats.toJson(this.statsSerializeEssentialOption);
            // console.log(o);

            let errors: string[] = o.errors;
            if (errors.length) {
                let errorMessage = '\n' + errors.join('\n\n') + '\n';
                console.error(chalk.red(errorMessage));
                if (errors.length === 1) {
                    Shout.notify(`You have one JS build error!`);
                } else {
                    Shout.notify(`You have ${errors.length} JS build errors!`);
                }
            }

            let warnings: string[] = o.warnings;
            if (warnings.length) {
                let warningMessage = '\n' + warnings.join('\n\n') + '\n';
                console.warn(chalk.yellow(warningMessage));
                if (warnings.length === 1) {
                    Shout.notify(`You have one JS build warning!`);
                } else {
                    Shout.notify(`You have ${warnings.length} JS build warnings!`);
                }
            }

            for (let asset of o.assets) {
                if (asset.emitted) {
                    let kb = prettyBytes(asset.size);
                    Shout.timed(chalk.blue(asset.name), chalk.magenta(kb),
                        chalk.grey('in ' + this.settings.outputJsFolder + '/')
                    );
                }
            }

            if (this.flags.stats) {
                fse.outputJsonSync(this.settings.statJsonPath, stats.toJson());
            }

            let t = prettyMilliseconds(o.time);
            Shout.timed('Finished JS build after', chalk.green(t));
            hub.buildDone();
        });
    }
}
