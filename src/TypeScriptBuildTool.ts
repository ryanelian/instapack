import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import * as webpack from 'webpack';
import * as UglifyWebpackPlugin from 'uglifyjs-webpack-plugin';

import hub from './EventHub';
import { timedLog, CompilerFlags } from './CompilerUtilities';
import { Settings } from './Settings';
import { getLazyCompilerOptions, createUglifyESOptions, getTypeScriptTarget } from './TypeScriptConfigurationReader';
import { prettyBytes, prettyMilliseconds } from './PrettyUnits';

/**
 * Custom webpack plugin for managing TypeScript build lifecycle. 
 */
class TypeScriptBuildWebpackPlugin {

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
     * Apply function prototype for registering a webpack plugin.
     * @param compiler 
     */
    apply(compiler: webpack.Compiler) {
        compiler.plugin('compile', compilation => {
            timedLog('Compiling JS >', chalk.yellow(getTypeScriptTarget()), chalk.cyan(this.settings.jsEntry));
        });
    }
}

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
     * Gets a loader option capable of performing multi-threaded build!
     */
    get threadLoader() {
        return {
            loader: 'thread-loader',
            options: {
                workers: os.cpus().length - 1
            }
        };
    }

    /**
     * Gets a configured TypeScript rules for webpack.
     */
    get typescriptWebpackRules() {
        let loaders = [];
        if (this.flags.parallel) {
            loaders.push(this.threadLoader);
        }

        let options = getLazyCompilerOptions();
        options.sourceMap = this.flags.sourceMap;
        options.inlineSources = this.flags.sourceMap;

        loaders.push({
            loader: 'core-typescript-loader',
            options: {
                compilerOptions: options
            }
        });

        return {
            test: /\.tsx?$/,
            use: loaders
        };
    }

    /**
     * Gets a configured HTML template rules for webpack.
     */
    get templatesWebpackRules() {
        let loaders = [];
        if (this.flags.parallel) {
            loaders.push(this.threadLoader);
        }

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
        plugins.push(new webpack.NoEmitOnErrorsPlugin()); // Near-useless in current state...
        plugins.push(new TypeScriptBuildWebpackPlugin(this.settings, this.flags));

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
                extensions: ['.ts', '.tsx', '.js', '.html', '.htm', '.json'],
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
                rules: [this.typescriptWebpackRules, this.templatesWebpackRules]
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
     * Runs the TypeScript build engine. Automatically exits process if not in watch mode.
     */
    build() {
        webpack(this.webpackConfiguration, (error, stats) => {
            if (error) {
                timedLog(chalk.red('FATAL ERROR'), 'during JS build:');
                console.error(error);
                hub.buildDone();
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
            hub.buildDone();
        });
    }
}
