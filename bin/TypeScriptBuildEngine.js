"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const upath = require("upath");
const path = require("path");
const fse = require("fs-extra");
const chalk_1 = require("chalk");
const webpack = require("webpack");
const TypeScript = require("typescript");
const vue_loader_1 = require("vue-loader");
const dotenv = require("dotenv");
const PrettyUnits_1 = require("./PrettyUnits");
const TypeScriptBuildWebpackPlugin_1 = require("./TypeScriptBuildWebpackPlugin");
const Shout_1 = require("./Shout");
class TypeScriptBuildEngine {
    constructor(settings, flags) {
        this.settings = settings;
        this.flags = flags;
    }
    convertTypeScriptPathToWebpackAliasPath(baseUrl, value) {
        let result = upath.join(baseUrl, value);
        if (result.endsWith('/*')) {
            result = result.substr(0, result.length - 2);
        }
        return result;
    }
    getWebpackAlias(tsCompilerOptions) {
        let alias = JSON.parse(JSON.stringify(this.settings.alias));
        if (!tsCompilerOptions.paths) {
            return alias;
        }
        if (!tsCompilerOptions.baseUrl) {
            Shout_1.Shout.warning(chalk_1.default.cyan('tsconfig.json'), 'paths are defined, but baseUrl is not!', chalk_1.default.grey('(Ignoring)'));
            return alias;
        }
        for (let key in tsCompilerOptions.paths) {
            if (key === '*') {
                continue;
            }
            let values = tsCompilerOptions.paths[key];
            if (values.length > 1) {
                Shout_1.Shout.danger(chalk_1.default.cyan('tsconfig.json'), 'paths:', chalk_1.default.yellow(key), 'resolves to more than one path!', chalk_1.default.grey('(Using the first one.)'));
            }
            let value = values[0];
            if (!value) {
                Shout_1.Shout.warning(chalk_1.default.cyan('tsconfig.json'), 'paths:', chalk_1.default.yellow(key), 'is empty!');
                continue;
            }
            if (key.endsWith('/*')) {
                key = key.substr(0, key.length - 2);
            }
            let result = this.convertTypeScriptPathToWebpackAliasPath(tsCompilerOptions.baseUrl, value);
            if (!alias[key]) {
                alias[key] = result;
            }
        }
        return alias;
    }
    getWildcardModules(tsCompilerOptions) {
        let valid = tsCompilerOptions.baseUrl && tsCompilerOptions.paths && tsCompilerOptions.paths['*'];
        if (!valid) {
            return null;
        }
        let wildcards = tsCompilerOptions.paths['*'];
        if (!wildcards[0]) {
            Shout_1.Shout.warning(chalk_1.default.cyan('tsconfig.json'), 'paths:', chalk_1.default.yellow('*'), 'is empty!');
            return null;
        }
        let r = new Set();
        for (let value of wildcards) {
            let result = this.convertTypeScriptPathToWebpackAliasPath(tsCompilerOptions.baseUrl, value);
            r.add(result);
        }
        r.add('node_modules');
        return Array.from(r);
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
    readEnvFile() {
        return __awaiter(this, void 0, void 0, function* () {
            let env = {};
            let dotEnvPath = this.settings.dotEnv;
            if ((yield fse.pathExists(dotEnvPath)) === false) {
                return env;
            }
            ;
            let dotEnvRaw = yield fse.readFile(dotEnvPath, 'utf8');
            let parsedEnv = dotenv.parse(dotEnvRaw);
            Object.assign(env, parsedEnv);
            Object.assign(env, this.flags.env);
            return env;
        });
    }
    createTypescriptWebpackRules(tsCompilerOptions, useBabel) {
        let tsRules = {
            test: /\.tsx?$/,
            use: []
        };
        if (useBabel) {
            tsRules.use.push({
                loader: 'babel-loader'
            });
        }
        tsRules.use.push({
            loader: 'core-typescript-loader',
            options: {
                compilerOptions: tsCompilerOptions
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
    createOnBuildStartMessageDelegate(tsCompilerOptions) {
        let buildTargetWarned = false;
        let compileTarget = tsCompilerOptions.target;
        if (!compileTarget) {
            compileTarget = TypeScript.ScriptTarget.ES3;
        }
        let t = TypeScript.ScriptTarget[compileTarget].toUpperCase();
        return () => {
            if (t !== 'ES5' && !buildTargetWarned) {
                Shout_1.Shout.danger('TypeScript compile target is not', chalk_1.default.yellow('ES5') + '!', chalk_1.default.grey('(tsconfig.json)'));
                buildTargetWarned = true;
            }
            Shout_1.Shout.timed('Compiling', chalk_1.default.cyan('index.ts'), '>', chalk_1.default.yellow(t), chalk_1.default.grey('in ' + this.settings.inputJsFolder + '/'));
        };
    }
    createWebpackPlugins(tsCompilerOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            let plugins = [];
            let onBuildStart = this.createOnBuildStartMessageDelegate(tsCompilerOptions);
            plugins.push(new TypeScriptBuildWebpackPlugin_1.TypeScriptBuildWebpackPlugin({
                onBuildStart: onBuildStart,
                minify: this.flags.production,
                sourceMap: this.flags.sourceMap
            }));
            plugins.push(new vue_loader_1.VueLoaderPlugin());
            let env = yield this.readEnvFile();
            if (Object.keys(env).length > 0) {
                plugins.push(new webpack.EnvironmentPlugin(env));
            }
            return plugins;
        });
    }
    createWebpackRules(tsCompilerOptions, useBabel) {
        let rules = [
            this.createTypescriptWebpackRules(tsCompilerOptions, useBabel),
            this.vueWebpackRules,
            this.templatesWebpackRules,
            this.cssWebpackRules
        ];
        if (useBabel) {
            rules.push(this.jsBabelWebpackRules);
        }
        return rules;
    }
    createWebpackConfiguration() {
        return __awaiter(this, void 0, void 0, function* () {
            let useBabel = yield fse.pathExists(this.settings.babelConfiguration);
            let tsconfig = this.settings.readTsConfig();
            let tsCompilerOptions = tsconfig.options;
            tsCompilerOptions.noEmit = false;
            tsCompilerOptions.sourceMap = this.flags.sourceMap;
            tsCompilerOptions.inlineSources = this.flags.sourceMap;
            let alias = this.getWebpackAlias(tsCompilerOptions);
            let wildcards = this.getWildcardModules(tsCompilerOptions);
            let rules = this.createWebpackRules(tsCompilerOptions, useBabel);
            let plugins = yield this.createWebpackPlugins(tsCompilerOptions);
            let osEntry = path.normalize(this.settings.jsEntry);
            let osOutputJsFolder = path.normalize(this.settings.outputJsFolder);
            let config = {
                entry: osEntry,
                output: {
                    filename: this.settings.jsOut,
                    chunkFilename: this.settings.jsChunkFileName,
                    path: osOutputJsFolder,
                    publicPath: 'js/'
                },
                externals: this.settings.externals,
                resolve: {
                    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.vue', '.wasm', '.json', '.html'],
                    alias: alias
                },
                resolveLoader: {
                    modules: [
                        path.resolve(__dirname, 'loaders'),
                        path.resolve(__dirname, '../node_modules'),
                        path.resolve(__dirname, '..', '..'),
                    ]
                },
                module: {
                    rules: rules
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
                plugins: plugins
            };
            if (wildcards) {
                config.resolve.modules = wildcards;
            }
            if (this.flags.sourceMap === false) {
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
        });
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
    runWebpackAsync(webpackConfiguration) {
        return new Promise((ok, reject) => {
            webpack(webpackConfiguration, (error, stats) => {
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
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            let webpackConfiguration = yield this.createWebpackConfiguration();
            yield this.runWebpackAsync(webpackConfiguration);
        });
    }
}
exports.TypeScriptBuildEngine = TypeScriptBuildEngine;
