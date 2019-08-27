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
const upath = require("upath");
const path = require("path");
const fse = require("fs-extra");
const url = require("url");
const chalk_1 = require("chalk");
const webpack = require("webpack");
const webpackDevServer = require("webpack-dev-server");
const TypeScript = require("typescript");
const vue_loader_1 = require("vue-loader");
const CompilerResolver_1 = require("./CompilerResolver");
const PrettyUnits_1 = require("./PrettyUnits");
const Shout_1 = require("./Shout");
const PathFinder_1 = require("./variables-factory/PathFinder");
const LoaderPaths_1 = require("./loaders/LoaderPaths");
const TypescriptConfigParser_1 = require("./TypescriptConfigParser");
class TypeScriptBuildEngine {
    constructor(variables) {
        this.useBabel = false;
        this.wormholes = new Set();
        this.variables = variables;
        this.finder = new PathFinder_1.PathFinder(variables);
        if (variables.hot) {
            this.outputPublicPath = `http://localhost:${this.variables.port1}/`;
        }
        else {
            this.outputPublicPath = 'js/';
        }
        this.typescriptCompilerOptions = TypescriptConfigParser_1.parseTypescriptConfig(variables.root, variables.typescriptConfiguration).options;
        this.typescriptCompilerOptions.noEmit = false;
        this.typescriptCompilerOptions.emitDeclarationOnly = false;
        this.typescriptCompilerOptions.sourceMap = variables.sourceMap;
        this.typescriptCompilerOptions.inlineSources = variables.sourceMap;
        this.languageTarget = this.typescriptCompilerOptions.target || TypeScript.ScriptTarget.ES3;
    }
    convertTypeScriptPathToWebpackAliasPath(baseUrl, value) {
        let result = upath.join(baseUrl, value);
        if (result.endsWith('/*')) {
            result = result.substr(0, result.length - 2);
        }
        return result;
    }
    mergeTypeScriptPathAlias() {
        let alias = Object.assign({}, this.variables.alias);
        if (!this.typescriptCompilerOptions.paths) {
            return alias;
        }
        if (!this.typescriptCompilerOptions.baseUrl) {
            Shout_1.Shout.warning(chalk_1.default.cyan('tsconfig.json'), 'paths are defined, but baseUrl is not!', chalk_1.default.grey('(Ignoring)'));
            return alias;
        }
        for (let key in this.typescriptCompilerOptions.paths) {
            if (key === '*') {
                continue;
            }
            let values = this.typescriptCompilerOptions.paths[key];
            if (values.length > 1) {
                Shout_1.Shout.warning(chalk_1.default.cyan('tsconfig.json'), 'paths:', chalk_1.default.yellow(key), 'resolves to more than one path!', chalk_1.default.grey('(Using the first one.)'));
            }
            let value = values[0];
            if (!value) {
                Shout_1.Shout.warning(chalk_1.default.cyan('tsconfig.json'), 'paths:', chalk_1.default.yellow(key), 'is empty!');
                continue;
            }
            if (key.endsWith('/*')) {
                key = key.substr(0, key.length - 2);
            }
            let result = this.convertTypeScriptPathToWebpackAliasPath(this.typescriptCompilerOptions.baseUrl, value);
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
        let r = new Set();
        let p = this.typescriptCompilerOptions.paths;
        if (p && p['*']) {
            for (let value of p['*']) {
                let result = this.convertTypeScriptPathToWebpackAliasPath(this.typescriptCompilerOptions.baseUrl, value);
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
            test: /\.(jsx?|mjs)$/,
            exclude: /node_modules/,
            use: {
                loader: LoaderPaths_1.LoaderPaths.babel
            }
        };
    }
    get libGuardRules() {
        return {
            test: /\.m?js$/,
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
        let loaders = [];
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
        let tsRules = {
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
                    loader: LoaderPaths_1.LoaderPaths.template
                }]
        };
    }
    get cssWebpackRules() {
        let vueStyleLoader = {
            loader: LoaderPaths_1.LoaderPaths.vueStyle
        };
        let cssModulesLoader = {
            loader: LoaderPaths_1.LoaderPaths.css,
            options: {
                modules: true,
                url: false
            }
        };
        let cssLoader = {
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
    createWormholeToHotScript(uri) {
        return `// instapack wormhole: automagically reference the real hot-reloading script
function inject() {
    let body = document.getElementsByTagName('body')[0];

    let target = document.createElement('script');
    target.src = '${uri}';
    body.appendChild(target);
}

inject();
`;
    }
    createWebpackPlugins() {
        let plugins = [];
        plugins.push(new vue_loader_1.VueLoaderPlugin());
        if (Object.keys(this.variables.env).length > 0) {
            plugins.push(new webpack.EnvironmentPlugin(this.variables.env));
        }
        return plugins;
    }
    createWebpackRules() {
        let rules = [
            this.typescriptWebpackRules,
            this.vueWebpackRules,
            this.templatesWebpackRules,
            this.cssWebpackRules,
            this.libGuardRules
        ];
        if (this.useBabel) {
            rules.push(this.jsBabelWebpackRules);
        }
        return rules;
    }
    get webpackConfigurationDevTool() {
        if (this.variables.sourceMap === false) {
            return false;
        }
        if (this.variables.production) {
            return 'source-map';
        }
        if (this.variables.watch === false) {
            return 'source-map';
        }
        return 'eval-source-map';
    }
    createWebpackConfiguration() {
        let alias = this.mergeTypeScriptPathAlias();
        let wildcards = this.getWildcardModules();
        let rules = this.createWebpackRules();
        let plugins = this.createWebpackPlugins();
        let osEntry = path.normalize(this.finder.jsEntry);
        let osOutputJsFolder = path.normalize(this.finder.jsOutputFolder);
        let config = {
            entry: [osEntry],
            output: {
                filename: this.finder.jsOutputFileName,
                chunkFilename: this.finder.jsChunkFileName,
                path: osOutputJsFolder,
                publicPath: this.outputPublicPath
            },
            externals: this.variables.externals,
            resolve: {
                extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.vue', '.wasm', '.json'],
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
            plugins: plugins,
            watchOptions: {
                ignored: [/node_modules/]
            }
        };
        if (wildcards && config.resolve) {
            config.resolve.modules = wildcards;
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
            chunks: this.variables.hot,
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
    addCompilerBuildNotification(compiler) {
        let t = TypeScript.ScriptTarget[this.languageTarget].toUpperCase();
        compiler.hooks.compile.tap('typescript-compile-start', compilationParams => {
            Shout_1.Shout.timed('Compiling', chalk_1.default.cyan('index.ts'), '>>', chalk_1.default.yellow(t), chalk_1.default.grey('in ' + this.finder.jsInputFolder + '/'));
        });
        if (this.variables.production) {
            compiler.hooks.compilation.tap('typescript-minify-notify', compilation => {
                compilation.hooks.afterHash.tap('typescript-minify-notify', () => {
                    Shout_1.Shout.timed('TypeScript compilation finished! Minifying bundles...');
                });
            });
        }
        compiler.hooks.done.tapPromise('display-build-results', (stats) => __awaiter(this, void 0, void 0, function* () {
            this.displayBuildResults(stats);
        }));
    }
    buildOnce(webpackConfiguration) {
        let compiler = webpack(webpackConfiguration);
        this.addCompilerBuildNotification(compiler);
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
        let compiler = webpack(webpackConfiguration);
        this.addCompilerBuildNotification(compiler);
        return new Promise((ok, reject) => {
            compiler.watch({
                ignored: /node_modules/,
                aggregateTimeout: 300
            }, (err, stats) => {
                if (err) {
                    reject(err);
                }
                return ok();
            });
        });
    }
    displayBuildResults(stats) {
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
        let jsOutputPath;
        if (this.variables.hot) {
            jsOutputPath = this.outputPublicPath;
        }
        else {
            jsOutputPath = this.finder.jsOutputFolder + '/';
        }
        if (o.assets) {
            for (let asset of o.assets) {
                if (asset.emitted) {
                    let kb = PrettyUnits_1.prettyBytes(asset.size);
                    Shout_1.Shout.timed(chalk_1.default.blue(asset.name), chalk_1.default.magenta(kb), chalk_1.default.grey('in ' + jsOutputPath));
                }
            }
        }
        if (this.variables.hot && o.chunks) {
            for (let chunk of o.chunks) {
                if (chunk.initial === false) {
                    continue;
                }
                this.putWormholes(chunk.files);
            }
        }
        if (o.time) {
            let t = PrettyUnits_1.prettyMilliseconds(o.time);
            Shout_1.Shout.timed('Finished JS build after', chalk_1.default.green(t));
        }
        else {
            Shout_1.Shout.timed('Finished JS build.');
        }
    }
    putWormholes(fileNames) {
        if (!fileNames) {
            return;
        }
        for (let file of fileNames) {
            if (file.includes('.hot-update.js')) {
                continue;
            }
            if (this.wormholes.has(file)) {
                continue;
            }
            this.putWormhole(file).then(() => {
                this.wormholes.add(file);
            }).catch(err => {
                Shout_1.Shout.error(err);
            });
        }
    }
    putWormhole(fileName) {
        let physicalFilePath = upath.join(this.finder.jsOutputFolder, fileName);
        let relativeFilePath = upath.relative(this.finder.root, physicalFilePath);
        let hotUri = url.resolve(this.outputPublicPath, fileName);
        Shout_1.Shout.timed(`+wormhole: ${chalk_1.default.cyan(relativeFilePath)} --> ${chalk_1.default.cyan(hotUri)}`);
        let hotProxy = this.createWormholeToHotScript(hotUri);
        return fse.outputFile(physicalFilePath, hotProxy);
    }
    runDevServer(webpackConfiguration) {
        return __awaiter(this, void 0, void 0, function* () {
            let devServerOptions = {
                hot: true,
                contentBase: false,
                port: this.variables.port1,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                noInfo: true
            };
            webpackDevServer.addDevServerEntrypoints(webpackConfiguration, devServerOptions);
            const compiler = webpack(webpackConfiguration);
            this.addCompilerBuildNotification(compiler);
            const devServer = new webpackDevServer(compiler, devServerOptions);
            return new Promise((ok, reject) => {
                const server = devServer.listen(this.variables.port1, 'localhost', error => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    let p1 = chalk_1.default.green(this.variables.port1.toString());
                    Shout_1.Shout.timed(chalk_1.default.yellow('Hot Reload'), `Server running on http://localhost:${p1}/`);
                    ok();
                });
            });
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            this.useBabel = yield fse.pathExists(this.finder.babelConfiguration);
            let vueCompiler = yield CompilerResolver_1.resolveVueTemplateCompiler(this.finder.root);
            this.vueTemplateCompiler = vueCompiler.compiler;
            let webpackConfiguration = this.createWebpackConfiguration();
            if (this.variables.hot) {
                yield this.runDevServer(webpackConfiguration);
            }
            else if (this.variables.watch) {
                yield this.watch(webpackConfiguration);
            }
            else {
                let stats = yield this.buildOnce(webpackConfiguration);
                if (this.variables.stats) {
                    yield fse.outputJson(this.finder.statsJsonFilePath, stats.toJson());
                }
            }
        });
    }
}
exports.TypeScriptBuildEngine = TypeScriptBuildEngine;
