"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fse = require("fs-extra");
const chalk_1 = require("chalk");
const webpack = require("webpack");
const TypeScript = require("typescript");
const EventHub_1 = require("./EventHub");
const PrettyUnits_1 = require("./PrettyUnits");
const TypeScriptBuildWebpackPlugin_1 = require("./TypeScriptBuildWebpackPlugin");
const Shout_1 = require("./Shout");
class TypeScriptBuildTool {
    constructor(settings, flags) {
        this.settings = settings;
        this.flags = flags;
        this.tsconfigOptions = this.settings.readTsConfig().options;
        this.mergeTypeScriptPathsToWebpackAlias();
    }
    mergeTypeScriptPathsToWebpackAlias() {
        if (!this.tsconfigOptions.paths) {
            return;
        }
        if (!this.tsconfigOptions.baseUrl) {
            Shout_1.Shout.warning(chalk_1.default.cyan('tsconfig.json'), 'paths are defined, but baseUrl is not!');
            return;
        }
        for (let key in this.tsconfigOptions.paths) {
            let originalKey = key;
            if (key === '*') {
                Shout_1.Shout.warning(chalk_1.default.cyan('tsconfig.json'), 'paths:', chalk_1.default.yellow(key), 'is not supported!');
                continue;
            }
            let values = this.tsconfigOptions.paths[key];
            if (values.length > 1) {
                Shout_1.Shout.warning(chalk_1.default.cyan('tsconfig.json'), 'paths:', chalk_1.default.yellow(key), 'resolves to more than one path!', chalk_1.default.grey('(Only the first will be honored.)'));
            }
            let value = values[0];
            if (!value) {
                Shout_1.Shout.warning(chalk_1.default.cyan('tsconfig.json'), 'paths:', chalk_1.default.yellow(key), 'is empty!');
                continue;
            }
            let wildcard = false;
            if (key.endsWith('/*')) {
                wildcard = true;
                key = key.substr(0, key.length - 2);
            }
            if (value.endsWith('/*')) {
                value = value.substr(0, value.length - 2);
            }
            else {
                if (wildcard) {
                    Shout_1.Shout.warning(chalk_1.default.cyan('tsconfig.json'), 'paths:', chalk_1.default.yellow(originalKey), 'is a wildcard but its value is not!', chalk_1.default.grey('(Resolves to index.ts)'));
                }
            }
            if (!this.settings.alias[key]) {
                this.settings.alias[key] = path.resolve(this.settings.root, this.tsconfigOptions.baseUrl, value);
            }
        }
    }
    get buildTarget() {
        let t = this.tsconfigOptions.target;
        if (!t) {
            t = TypeScript.ScriptTarget.ES3;
        }
        return TypeScript.ScriptTarget[t];
    }
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
        plugins.push(new TypeScriptBuildWebpackPlugin_1.TypeScriptBuildWebpackPlugin({
            jsEntry: this.settings.jsEntry,
            target: this.buildTarget,
            production: this.flags.production,
            sourceMap: this.flags.sourceMap
        }));
        plugins.push(new webpack.optimize.CommonsChunkPlugin({
            name: 'DLL',
            filename: this.settings.jsOutVendorFileName,
            minChunks: module => module.context && module.context.includes('node_modules')
        }));
        if (this.flags.production) {
            plugins.push(new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify('production')
                }
            }));
        }
        return plugins;
    }
    get webpackConfiguration() {
        let config = {
            entry: path.normalize(this.settings.jsEntry),
            output: {
                filename: this.settings.jsOut,
                path: path.normalize(this.settings.outputJsFolder)
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
                Shout_1.Shout.fatal('during JS build (tool):', error);
                Shout_1.Shout.notify('FATAL ERROR during JS build!');
                EventHub_1.default.buildDone();
                return;
            }
            let o = stats.toJson(this.webpackStatsJsonMinimal);
            if (stats.hasErrors() || stats.hasWarnings()) {
                let buildErrors = '\n' + stats.toString(this.webpackStatsErrorsOnly).trim() + '\n';
                console.error(buildErrors);
                Shout_1.Shout.notify('You have one or more JS build errors / warnings!');
            }
            for (let asset of o.assets) {
                if (asset.emitted) {
                    let kb = PrettyUnits_1.prettyBytes(asset.size);
                    Shout_1.Shout.timed(chalk_1.default.blue(asset.name), chalk_1.default.magenta(kb));
                }
            }
            if (this.flags.stats) {
                fse.outputJsonSync(this.settings.statJsonPath, stats.toJson());
            }
            let t = PrettyUnits_1.prettyMilliseconds(o.time);
            Shout_1.Shout.timed('Finished JS build after', chalk_1.default.green(t));
            EventHub_1.default.buildDone();
        });
    }
}
exports.TypeScriptBuildTool = TypeScriptBuildTool;
