import * as path from 'path';
import chalk from 'chalk';
import * as webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import hub from './EventHub';
import { timedLog, ICompilerFlags } from './CompilerUtilities';
import { Settings } from './Settings';
import { getLazyCompilerOptions } from './TypeScriptConfigurationReader';
import { prettyBytes, prettyMilliseconds } from './PrettyUnits';
import { TypeScriptBuildWebpackPlugin } from './TypeScriptBuildWebpackPlugin';

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
     * Constructs a new instance of TypeScriptBuildTool using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(settings: Settings, flags: ICompilerFlags) {
        this.settings = settings
        this.flags = flags;
    }

    /**
     * Gets a configured TypeScript rules for webpack.
     */
    get typescriptWebpackRules() {
        let options = getLazyCompilerOptions();
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
     * Gets a configured HTML template rules for webpack.
     */
    get templatesWebpackRules() {
        return {
            test: /\.html?$/,
            use: [{
                loader: 'template-loader'
            }]
        };
    }

    /**
     * Returns a configured webpack plugins.
     */
    getWebpackPlugins() {
        let plugins = [];
        plugins.push(new webpack.NoEmitOnErrorsPlugin()); // Near-useless in current state...
        plugins.push(new TypeScriptBuildWebpackPlugin(this.settings, this.flags));

        // https://webpack.js.org/plugins/commons-chunk-plugin/
        // grab everything imported from node_modules, put into a separate file: ipack_modules.js
        plugins.push(new webpack.optimize.CommonsChunkPlugin({
            name: 'common_modules',
            filename: this.settings.jsOutVendorFileName,
            minChunks: module => module.context && module.context.includes('node_modules')
        }));

        if (this.flags.analyze) {
            plugins.push(new BundleAnalyzerPlugin({
                analyzerMode: 'static',
                reportFilename: 'analysis.html',
                logLevel: 'warn'
            }));
        }

        if (this.flags.production) {
            plugins.push(new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify('production')
                }
            }));
        }

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
                // chunkFilename: this.settings.jsOutSplitFileName, // https://webpack.js.org/guides/code-splitting/
                path: path.normalize(this.settings.outputJsFolder)
            },
            externals: this.settings.externals,
            resolve: {
                extensions: ['.ts', '.tsx', '.js', '.html', '.json'],
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
            if (this.flags.analyze && !this.flags.watch) {
                timedLog('Generating the module size analysis report for JS output, please wait...');
                setTimeout(() => {
                    process.exit(0);
                }, 5 * 1000);
                return;
            }

            hub.buildDone();
        });
    }
}
