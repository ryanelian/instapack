"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const os = require("os");
const chalk_1 = require("chalk");
const webpack = require("webpack");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const UglifyWebpackPlugin = require("uglifyjs-webpack-plugin");
const CompilerUtilities_1 = require("./CompilerUtilities");
const UglifyESOptions_1 = require("./UglifyESOptions");
const PrettyUnits_1 = require("./PrettyUnits");
class TypeScriptBuildTool {
    constructor(settings, flags) {
        this.settings = settings;
        this.flags = flags;
    }
    getParallelLoaders(cached) {
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
        return {
            test: /\.tsx?$/,
            use: loaders
        };
    }
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
                uglifyOptions: UglifyESOptions_1.createUglifyESOptions()
            }));
        }
        return plugins;
    }
    get webpackConfiguration() {
        let config = {
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
                    path.resolve(__dirname, 'loaders'),
                    path.resolve(__dirname, '../node_modules'),
                    path.resolve(__dirname, '..', '..'),
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
        };
    }
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
        };
    }
    build() {
        webpack(this.webpackConfiguration, (error, stats) => {
            if (error) {
                CompilerUtilities_1.timedLog(chalk_1.default.red('FATAL ERROR'), 'during JS build:');
                console.error(error);
                return;
            }
            let o = stats.toJson(this.webpackStatsJsonMinimal);
            if (stats.hasErrors() || stats.hasWarnings()) {
                console.log(stats.toString(this.webpackStatsErrorsOnly));
            }
            for (let asset of o.assets) {
                if (asset.emitted) {
                    let kb = PrettyUnits_1.prettyBytes(asset.size);
                    CompilerUtilities_1.timedLog(chalk_1.default.blue(asset.name), chalk_1.default.magenta(kb));
                }
            }
            let t = PrettyUnits_1.prettyMilliseconds(o.time);
            CompilerUtilities_1.timedLog('Finished JS build after', chalk_1.default.green(t));
        });
    }
}
exports.TypeScriptBuildTool = TypeScriptBuildTool;
