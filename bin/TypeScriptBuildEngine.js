"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const upath = require("upath");
const fse = require("fs-extra");
const chalk = require("chalk");
const webpack = require("webpack");
const webpackDevServer = require("webpack-dev-server");
const portfinder = require("portfinder");
const TypeScript = require("typescript");
const vue_loader_1 = require("vue-loader");
const CompilerResolver_1 = require("./CompilerResolver");
const Shout_1 = require("./Shout");
const PathFinder_1 = require("./variables-factory/PathFinder");
const LoaderPaths_1 = require("./loaders/LoaderPaths");
const TypescriptConfigParser_1 = require("./TypescriptConfigParser");
const InstapackBuildPlugin_1 = require("./plugins/InstapackBuildPlugin");
class TypeScriptBuildEngine {
    constructor(variables) {
        this.useBabel = false;
        this.variables = variables;
        this.finder = new PathFinder_1.PathFinder(variables);
        this.typescriptCompilerOptions = TypescriptConfigParser_1.parseTypescriptConfig(variables.root, variables.typescriptConfiguration).options;
        this.typescriptCompilerOptions.noEmit = false;
        this.typescriptCompilerOptions.emitDeclarationOnly = false;
        this.typescriptCompilerOptions.sourceMap = variables.sourceMap;
        this.typescriptCompilerOptions.inlineSources = variables.sourceMap;
    }
    convertTypeScriptPathToWebpackAliasPath(baseUrl, value) {
        let result = upath.join(baseUrl, value);
        if (result.endsWith('/*')) {
            result = result.substr(0, result.length - 2);
        }
        return result;
    }
    mergeTypeScriptPathAlias() {
        const alias = Object.assign({}, this.variables.alias);
        if (!this.typescriptCompilerOptions.paths) {
            return alias;
        }
        if (!this.typescriptCompilerOptions.baseUrl) {
            Shout_1.Shout.warning(chalk.cyan('tsconfig.json'), 'paths are defined, but baseUrl is not!', chalk.grey('(Ignoring)'));
            return alias;
        }
        for (let key in this.typescriptCompilerOptions.paths) {
            if (key === '*') {
                continue;
            }
            const values = this.typescriptCompilerOptions.paths[key];
            if (values.length > 1) {
                Shout_1.Shout.warning(chalk.cyan('tsconfig.json'), 'paths:', chalk.yellow(key), 'resolves to more than one path!', chalk.grey('(Using the first one.)'));
            }
            const value = values[0];
            if (!value) {
                Shout_1.Shout.warning(chalk.cyan('tsconfig.json'), 'paths:', chalk.yellow(key), 'is empty!');
                continue;
            }
            if (key.endsWith('/*')) {
                key = key.substr(0, key.length - 2);
            }
            const result = this.convertTypeScriptPathToWebpackAliasPath(this.typescriptCompilerOptions.baseUrl, value);
            if (!alias[key]) {
                alias[key] = result;
            }
        }
        return alias;
    }
    getWildcardModules() {
        if (!this.typescriptCompilerOptions.baseUrl) {
            return undefined;
        }
        const r = new Set();
        const p = this.typescriptCompilerOptions.paths;
        if (p && p['*']) {
            for (const value of p['*']) {
                const result = this.convertTypeScriptPathToWebpackAliasPath(this.typescriptCompilerOptions.baseUrl, value);
                r.add(result);
            }
        }
        else {
            r.add(this.typescriptCompilerOptions.baseUrl);
        }
        r.add('node_modules');
        return Array.from(r);
    }
    get jsBabelWebpackRules() {
        return {
            test: /\.js$/,
            use: {
                loader: LoaderPaths_1.LoaderPaths.babel
            }
        };
    }
    get libGuardRules() {
        return {
            test: /\.js$/,
            include: /node_modules/,
            use: [{
                    loader: LoaderPaths_1.LoaderPaths.libGuard,
                    options: {
                        compilerOptions: this.typescriptCompilerOptions
                    }
                }]
        };
    }
    get typescriptWebpackRules() {
        const loaders = [];
        if (this.useBabel) {
            loaders.push({
                loader: LoaderPaths_1.LoaderPaths.babel
            });
        }
        loaders.push({
            loader: LoaderPaths_1.LoaderPaths.typescript,
            options: {
                compilerOptions: this.typescriptCompilerOptions
            }
        });
        const tsRules = {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: loaders
        };
        return tsRules;
    }
    get vueWebpackRules() {
        return {
            test: /\.vue$/,
            exclude: /node_modules/,
            use: [{
                    loader: LoaderPaths_1.LoaderPaths.vue,
                    options: {
                        compiler: this.vueTemplateCompiler,
                        transformAssetUrls: {},
                        appendExtension: true
                    }
                }]
        };
    }
    get templatesWebpackRules() {
        return {
            test: /\.html?$/,
            exclude: /node_modules/,
            use: [{
                    loader: LoaderPaths_1.LoaderPaths.template,
                    options: {
                        attrs: false
                    }
                }]
        };
    }
    get cssWebpackRules() {
        const vueStyleLoader = {
            loader: LoaderPaths_1.LoaderPaths.vueStyle
        };
        const cssModulesLoader = {
            loader: LoaderPaths_1.LoaderPaths.css,
            options: {
                modules: true,
                localIdentName: '[local]_[hash:base64:5]',
                url: false
            }
        };
        const cssLoader = {
            loader: LoaderPaths_1.LoaderPaths.css,
            options: {
                url: false
            }
        };
        return {
            test: /\.css$/,
            exclude: /node_modules/,
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
    createWebpackPlugins() {
        var _a;
        const plugins = [];
        const typescriptTarget = (_a = this.typescriptCompilerOptions.target, (_a !== null && _a !== void 0 ? _a : TypeScript.ScriptTarget.ES3));
        plugins.push(new InstapackBuildPlugin_1.InstapackBuildPlugin(this.variables, typescriptTarget));
        plugins.push(new vue_loader_1.VueLoaderPlugin());
        if (Object.keys(this.variables.env).length > 0) {
            plugins.push(new webpack.EnvironmentPlugin(this.variables.env));
        }
        return plugins;
    }
    createWebpackRules() {
        const rules = [
            this.typescriptWebpackRules,
            this.vueWebpackRules,
            this.templatesWebpackRules,
            this.cssWebpackRules
        ];
        if (this.useBabel) {
            rules.push(this.jsBabelWebpackRules);
        }
        if (this.typescriptCompilerOptions.target) {
            if (this.typescriptCompilerOptions.target < TypeScript.ScriptTarget.ESNext) {
                rules.push(this.libGuardRules);
            }
        }
        return rules;
    }
    get webpackConfigurationDevTool() {
        if (this.variables.sourceMap === false) {
            return false;
        }
        if (this.variables.production) {
            return 'hidden-source-map';
        }
        if (this.variables.watch === false) {
            return 'source-map';
        }
        return 'eval-source-map';
    }
    createWebpackConfiguration() {
        const alias = this.mergeTypeScriptPathAlias();
        const wildcards = this.getWildcardModules();
        const rules = this.createWebpackRules();
        const plugins = this.createWebpackPlugins();
        const osEntry = path.normalize(this.finder.jsEntry);
        const osOutputJsFolder = path.normalize(this.finder.jsOutputFolder);
        const config = {
            entry: [osEntry],
            output: {
                filename: (chunkData) => {
                    if (chunkData.chunk.name === 'main') {
                        return this.finder.jsOutputFileName;
                    }
                    else {
                        return this.finder.jsChunkFileName;
                    }
                },
                chunkFilename: this.finder.jsChunkFileName,
                path: osOutputJsFolder,
                publicPath: 'js/',
                library: this.variables.namespace
            },
            externals: this.variables.externals,
            resolve: {
                extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.json'],
                alias: alias
            },
            module: {
                rules: rules
            },
            mode: (this.variables.production ? 'production' : 'development'),
            devtool: this.webpackConfigurationDevTool,
            optimization: {
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
        if (config.output) {
            config.output['ecmaVersion'] = this.getECMAScriptVersion();
        }
        if (wildcards && config.resolve) {
            config.resolve.modules = wildcards;
        }
        return config;
    }
    getECMAScriptVersion() {
        switch (this.typescriptCompilerOptions.target) {
            case TypeScript.ScriptTarget.ES3:
                return 5;
            case TypeScript.ScriptTarget.ES5:
                return 5;
            case TypeScript.ScriptTarget.ES2015:
                return 2015;
            case TypeScript.ScriptTarget.ES2016:
                return 2016;
            case TypeScript.ScriptTarget.ES2017:
                return 2017;
            case TypeScript.ScriptTarget.ES2018:
                return 2018;
            case TypeScript.ScriptTarget.ES2019:
                return 2019;
            case TypeScript.ScriptTarget.ES2020:
                return 2020;
            case TypeScript.ScriptTarget.ESNext:
                return 2020;
            default:
                return 5;
        }
    }
    buildOnce(webpackConfiguration) {
        const compiler = webpack(webpackConfiguration);
        return new Promise((ok, reject) => {
            compiler.run((err, stats) => {
                if (err) {
                    reject(err);
                }
                ok(stats);
            });
        });
    }
    watch(webpackConfiguration) {
        const compiler = webpack(webpackConfiguration);
        return new Promise((ok, reject) => {
            compiler.watch({
                ignored: ['node_modules'],
                aggregateTimeout: 300
            }, (err) => {
                if (err) {
                    reject(err);
                }
                return ok();
            });
        });
    }
    runDevServer(webpackConfiguration, port) {
        return __awaiter(this, void 0, void 0, function* () {
            const devServerOptions = {
                hot: true,
                contentBase: false,
                port: port,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                noInfo: true
            };
            webpackDevServer.addDevServerEntrypoints(webpackConfiguration, devServerOptions);
            const compiler = webpack(webpackConfiguration);
            const devServer = new webpackDevServer(compiler, devServerOptions);
            const createServerTask = new Promise((ok, reject) => {
                devServer.listen(port, 'localhost', error => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    ok();
                });
            });
            yield createServerTask;
            Shout_1.Shout.timed(chalk.yellow('Hot Reload'), `server running on http://localhost:${chalk.green(port)}/`);
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            this.useBabel = yield fse.pathExists(this.finder.babelConfiguration);
            this.vueTemplateCompiler = yield CompilerResolver_1.resolveVueTemplateCompiler(this.finder.root);
            const webpackConfiguration = this.createWebpackConfiguration();
            if (this.variables.serve) {
                let basePort = 28080;
                if (this.variables.port1) {
                    basePort = this.variables.port1;
                }
                const port = yield portfinder.getPortPromise({
                    port: basePort
                });
                if (!webpackConfiguration.output) {
                    throw new Error('Unexpected undefined value: webpack configuration output object.');
                }
                webpackConfiguration.output.publicPath = `http://localhost:${port}/`;
                yield this.runDevServer(webpackConfiguration, port);
            }
            else if (this.variables.watch) {
                yield this.watch(webpackConfiguration);
            }
            else {
                const stats = yield this.buildOnce(webpackConfiguration);
                if (this.variables.stats && this.variables.production) {
                    yield fse.outputJson(this.finder.statsJsonFilePath, stats.toJson());
                }
            }
        });
    }
}
exports.TypeScriptBuildEngine = TypeScriptBuildEngine;
