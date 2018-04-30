"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fse = require("fs-extra");
const chalk_1 = require("chalk");
const webpack = require("webpack");
const TypeScript = require("typescript");
const vue_loader_1 = require("vue-loader");
const PrettyUnits_1 = require("./PrettyUnits");
const TypeScriptBuildWebpackPlugin_1 = require("./TypeScriptBuildWebpackPlugin");
const Shout_1 = require("./Shout");
class TypeScriptBuildTool {
    constructor(settings, flags) {
        this.buildTargetWarned = false;
        this.settings = settings;
        this.flags = flags;
        this.babel = fse.existsSync(this.settings.babelConfiguration);
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
                Shout_1.Shout.danger(chalk_1.default.cyan('tsconfig.json'), 'paths:', chalk_1.default.yellow(key), 'resolves to more than one path!', chalk_1.default.grey('(Bundler will use the first one.)'));
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
    get jsBabelWebpackRules() {
        return {
            test: /\.m?jsx?$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader'
            }
        };
    }
    get typescriptWebpackRules() {
        let options = this.tsconfigOptions;
        options.sourceMap = this.flags.sourceMap;
        options.inlineSources = this.flags.sourceMap;
        let tsRules = {
            test: /\.tsx?$/,
            use: []
        };
        if (this.babel) {
            tsRules.use.push({
                loader: 'babel-loader'
            });
        }
        tsRules.use.push({
            loader: 'core-typescript-loader',
            options: {
                compilerOptions: options
            }
        });
        return tsRules;
    }
    get vueWebpackRules() {
        return {
            test: /\.vue$/,
            use: [{
                    loader: 'vue-loader',
                    options: {
                        transformAssetUrls: {},
                    }
                }]
        };
    }
    get templatesWebpackRules() {
        return {
            test: /\.html$/,
            use: [{
                    loader: 'template-loader'
                }]
        };
    }
    get cssWebpackRules() {
        let vueStyleLoader = {
            loader: 'vue-style-loader'
        };
        let cssModulesLoader = {
            loader: 'css-loader',
            options: {
                modules: true,
                url: false
            }
        };
        let cssLoader = {
            loader: 'css-loader',
            options: {
                url: false
            }
        };
        return {
            test: /\.css$/,
            oneOf: [
                {
                    resourceQuery: /module/,
                    use: [vueStyleLoader, cssModulesLoader]
                }, {
                    use: [vueStyleLoader, cssLoader]
                }
            ]
        };
    }
    onBuildStart() {
        let t = this.tsconfigOptions.target;
        if (!t) {
            t = TypeScript.ScriptTarget.ES3;
        }
        let buildTarget = TypeScript.ScriptTarget[t].toUpperCase();
        if (buildTarget !== 'ES5' && !this.buildTargetWarned) {
            Shout_1.Shout.danger('TypeScript compile target is not', chalk_1.default.yellow('ES5') + '!', chalk_1.default.grey('(tsconfig.json)'));
            this.buildTargetWarned = true;
        }
        Shout_1.Shout.timed('Compiling', chalk_1.default.cyan('index.ts'), '>', chalk_1.default.yellow(buildTarget), chalk_1.default.grey('in ' + this.settings.inputJsFolder + '/'));
    }
    get webpackPlugins() {
        let plugins = [];
        plugins.push(new TypeScriptBuildWebpackPlugin_1.TypeScriptBuildWebpackPlugin({
            onBuildStart: this.onBuildStart.bind(this),
            minify: this.flags.production,
            sourceMap: this.flags.sourceMap
        }));
        plugins.push(new vue_loader_1.VueLoaderPlugin());
        return plugins;
    }
    get webpackConfiguration() {
        let config = {
            entry: path.normalize(this.settings.jsEntry),
            output: {
                filename: this.settings.jsOut,
                chunkFilename: this.settings.jsChunkFileName,
                path: path.normalize(this.settings.outputJsFolder),
                publicPath: 'js/'
            },
            externals: this.settings.externals,
            resolve: {
                extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.vue', '.wasm', '.json', '.html'],
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
                rules: [
                    this.typescriptWebpackRules,
                    this.vueWebpackRules,
                    this.templatesWebpackRules,
                    this.cssWebpackRules
                ]
            },
            mode: (this.flags.production ? 'production' : 'development'),
            devtool: (this.flags.production ? 'source-map' : 'eval-source-map'),
            optimization: {
                minimize: false,
                noEmitOnErrors: true,
                splitChunks: {
                    cacheGroups: {
                        vendors: {
                            name: 'dll',
                            test: /[\\/]node_modules[\\/]/,
                            chunks: 'initial',
                            enforce: true,
                            priority: -10
                        }
                    }
                }
            },
            performance: {
                hints: false
            },
            plugins: this.webpackPlugins
        };
        if (this.babel) {
            config.module.rules.push(this.jsBabelWebpackRules);
        }
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
    get statsSerializeEssentialOption() {
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
    build() {
        return new Promise((ok, reject) => {
            webpack(this.webpackConfiguration, (error, stats) => {
                if (error) {
                    reject(error);
                    return;
                }
                let o = stats.toJson(this.statsSerializeEssentialOption);
                let errors = o.errors;
                if (errors.length) {
                    let errorMessage = '\n' + errors.join('\n\n') + '\n';
                    console.error(chalk_1.default.red(errorMessage));
                    if (errors.length === 1) {
                        Shout_1.Shout.notify(`You have one JS build error!`);
                    }
                    else {
                        Shout_1.Shout.notify(`You have ${errors.length} JS build errors!`);
                    }
                }
                let warnings = o.warnings;
                if (warnings.length) {
                    let warningMessage = '\n' + warnings.join('\n\n') + '\n';
                    console.warn(chalk_1.default.yellow(warningMessage));
                    if (warnings.length === 1) {
                        Shout_1.Shout.notify(`You have one JS build warning!`);
                    }
                    else {
                        Shout_1.Shout.notify(`You have ${warnings.length} JS build warnings!`);
                    }
                }
                for (let asset of o.assets) {
                    if (asset.emitted) {
                        let kb = PrettyUnits_1.prettyBytes(asset.size);
                        Shout_1.Shout.timed(chalk_1.default.blue(asset.name), chalk_1.default.magenta(kb), chalk_1.default.grey('in ' + this.settings.outputJsFolder + '/'));
                    }
                }
                if (this.flags.stats) {
                    fse.outputJsonSync(this.settings.statJsonPath, stats.toJson());
                }
                let t = PrettyUnits_1.prettyMilliseconds(o.time);
                Shout_1.Shout.timed('Finished JS build after', chalk_1.default.green(t));
                if (this.flags.watch) {
                    return;
                }
                ok();
            });
        });
    }
}
exports.TypeScriptBuildTool = TypeScriptBuildTool;
