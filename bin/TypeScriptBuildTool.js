"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const chalk_1 = require("chalk");
const webpack = require("webpack");
const EventHub_1 = require("./EventHub");
const CompilerUtilities_1 = require("./CompilerUtilities");
const TypeScriptConfigurationReader_1 = require("./TypeScriptConfigurationReader");
const PrettyUnits_1 = require("./PrettyUnits");
class TypeScriptBuildWebpackPlugin {
    constructor(settings, flags) {
        this.settings = settings;
        this.flags = flags;
    }
    apply(compiler) {
        let tsTarget = TypeScriptConfigurationReader_1.getTypeScriptTarget();
        if (tsTarget !== 'ES5' && tsTarget !== 'ES3') {
            console.warn(chalk_1.default.red('DANGER') + ' UglifyJS 3 minifier only supports ES3 and ES5 build target! ' + chalk_1.default.grey('(tsconfig.json)'));
        }
        compiler.plugin('compile', compilation => {
            CompilerUtilities_1.timedLog('Compiling JS >', chalk_1.default.yellow(tsTarget), chalk_1.default.cyan(this.settings.jsEntry));
        });
    }
}
class TypeScriptBuildTool {
    constructor(settings, flags) {
        this.settings = settings;
        this.flags = flags;
    }
    get typescriptWebpackRules() {
        let options = TypeScriptConfigurationReader_1.getLazyCompilerOptions();
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
    get templatesWebpackRules() {
        return {
            test: /\.html?$/,
            use: [{
                    loader: 'template-loader'
                }]
        };
    }
    getWebpackPlugins() {
        let plugins = [];
        plugins.push(new webpack.NoEmitOnErrorsPlugin());
        plugins.push(new TypeScriptBuildWebpackPlugin(this.settings, this.flags));
        if (this.flags.production) {
            plugins.push(new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify('production')
                }
            }));
            plugins.push(new webpack.optimize.UglifyJsPlugin({
                sourceMap: this.flags.sourceMap,
                comments: false
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
                extensions: ['.ts', '.tsx', '.js', '.html', '.json'],
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
                EventHub_1.default.buildDone();
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
            EventHub_1.default.buildDone();
        });
    }
}
exports.TypeScriptBuildTool = TypeScriptBuildTool;
