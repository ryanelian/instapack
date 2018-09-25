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
const url = require("url");
const chalk_1 = require("chalk");
const webpack = require("webpack");
const hotClient = require("webpack-hot-client");
const devMiddleware = require("webpack-dev-middleware");
const express = require("express");
const TypeScript = require("typescript");
const vue_loader_1 = require("vue-loader");
const PrettyUnits_1 = require("./PrettyUnits");
const TypeScriptBuildWebpackPlugin_1 = require("./TypeScriptBuildWebpackPlugin");
const Shout_1 = require("./Shout");
const PortScanner_1 = require("./PortScanner");
const PathFinder_1 = require("./variables-factory/PathFinder");
const LoaderPaths_1 = require("./loaders/LoaderPaths");
const TypescriptConfigParser_1 = require("./TypescriptConfigParser");
class TypeScriptBuildEngine {
    constructor(variables) {
        this.wormholes = new Set();
        this.variables = variables;
        this.finder = new PathFinder_1.PathFinder(variables);
        this.outputPublicPath = 'js/';
    }
    convertTypeScriptPathToWebpackAliasPath(baseUrl, value) {
        let result = upath.join(baseUrl, value);
        if (result.endsWith('/*')) {
            result = result.substr(0, result.length - 2);
        }
        return result;
    }
    mergeTypeScriptPathAlias(tsCompilerOptions) {
        let alias = Object.assign({}, this.variables.alias);
        if (this.variables.hot) {
            let hotClientModulePath = require.resolve('webpack-hot-client/client');
            alias['webpack-hot-client/client'] = hotClientModulePath;
        }
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
            let result = this.convertTypeScriptPathToWebpackAliasPath(tsCompilerOptions.baseUrl, value);
            if (!alias[key]) {
                alias[key] = result;
            }
        }
        return alias;
    }
    getWildcardModules(tsCompilerOptions) {
        if (!tsCompilerOptions.baseUrl) {
            return undefined;
        }
        if (!tsCompilerOptions.paths) {
            return undefined;
        }
        let wildcards = tsCompilerOptions.paths['*'];
        if (!wildcards) {
            return undefined;
        }
        if (!wildcards[0]) {
            Shout_1.Shout.warning(chalk_1.default.cyan('tsconfig.json'), 'paths:', chalk_1.default.yellow('*'), 'is empty!');
            return undefined;
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
                loader: LoaderPaths_1.LoaderPaths.babel
            }
        };
    }
    createTypescriptWebpackRules(tsCompilerOptions, useBabel) {
        let tsRules = {
            test: /\.tsx?$/,
            use: []
        };
        if (useBabel) {
            tsRules.use.push({
                loader: LoaderPaths_1.LoaderPaths.babel
            });
        }
        tsRules.use.push({
            loader: LoaderPaths_1.LoaderPaths.typescript,
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
                    loader: LoaderPaths_1.LoaderPaths.vue,
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
    createOnBuildStartMessageDelegate(tsCompilerOptions) {
        let compileTarget = tsCompilerOptions.target;
        if (!compileTarget) {
            compileTarget = TypeScript.ScriptTarget.ES3;
        }
        let t = TypeScript.ScriptTarget[compileTarget].toUpperCase();
        return () => {
            Shout_1.Shout.timed('Compiling', chalk_1.default.cyan('index.ts'), '>', chalk_1.default.yellow(t), chalk_1.default.grey('in ' + this.finder.jsInputFolder + '/'));
        };
    }
    createWebpackPlugins(tsCompilerOptions) {
        let plugins = [];
        let onBuildStart = this.createOnBuildStartMessageDelegate(tsCompilerOptions);
        plugins.push(new TypeScriptBuildWebpackPlugin_1.TypeScriptBuildWebpackPlugin({
            onBuildStart: onBuildStart,
            minify: this.variables.production,
            sourceMap: this.variables.sourceMap
        }));
        plugins.push(new vue_loader_1.VueLoaderPlugin());
        if (Object.keys(this.variables.env).length > 0) {
            plugins.push(new webpack.EnvironmentPlugin(this.variables.env));
        }
        return plugins;
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
        return __awaiter(this, void 0, void 0, function* () {
            let useBabel = yield fse.pathExists(this.finder.babelConfiguration);
            let tsconfig = TypescriptConfigParser_1.parseTypescriptConfig(this.variables.root, this.variables.typescriptConfiguration);
            let tsCompilerOptions = tsconfig.options;
            tsCompilerOptions.noEmit = false;
            tsCompilerOptions.sourceMap = this.variables.sourceMap;
            tsCompilerOptions.inlineSources = this.variables.sourceMap;
            let alias = this.mergeTypeScriptPathAlias(tsCompilerOptions);
            let wildcards = this.getWildcardModules(tsCompilerOptions);
            let rules = this.createWebpackRules(tsCompilerOptions, useBabel);
            let plugins = this.createWebpackPlugins(tsCompilerOptions);
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
                    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.vue', '.wasm', '.json', '.html'],
                    alias: alias
                },
                module: {
                    rules: rules
                },
                mode: (this.variables.production ? 'production' : 'development'),
                devtool: this.webpackConfigurationDevTool,
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
            if (wildcards && config.resolve) {
                config.resolve.modules = wildcards;
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
    buildOnce(webpackConfiguration) {
        let compiler = webpack(webpackConfiguration);
        return new Promise((ok, reject) => {
            compiler.run((err, stats) => {
                if (err) {
                    reject(err);
                }
                this.displayBuildResults(stats);
                ok(stats);
            });
        });
    }
    watch(webpackConfiguration) {
        let compiler = webpack(webpackConfiguration);
        return new Promise((ok, reject) => {
            compiler.watch({
                ignored: /node_modules/,
                aggregateTimeout: 300
            }, (err, stats) => {
                if (err) {
                    reject(err);
                }
                this.displayBuildResults(stats);
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
            jsOutputPath = this.outputHotJsFolderUri;
        }
        else {
            jsOutputPath = this.finder.jsOutputFolder + '/';
        }
        for (let asset of o.assets) {
            if (asset.emitted) {
                let kb = PrettyUnits_1.prettyBytes(asset.size);
                Shout_1.Shout.timed(chalk_1.default.blue(asset.name), chalk_1.default.magenta(kb), chalk_1.default.grey('in ' + jsOutputPath));
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
        let t = PrettyUnits_1.prettyMilliseconds(o.time);
        Shout_1.Shout.timed('Finished JS build after', chalk_1.default.green(t));
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
        let hotUri = url.resolve(this.outputHotJsFolderUri, fileName);
        Shout_1.Shout.timed(`+wormhole: ${chalk_1.default.cyan(relativeFilePath)} --> ${chalk_1.default.cyan(hotUri)}`);
        let hotProxy = this.createWormholeToHotScript(hotUri);
        return fse.outputFile(physicalFilePath, hotProxy);
    }
    get outputHotJsFolderUri() {
        return `http://localhost:${this.variables.port1}/js/`;
    }
    runDevServer(webpackConfiguration) {
        const logLevel = 'warn';
        const compiler = webpack(webpackConfiguration);
        compiler.hooks.done.tapPromise('display-build-results', (stats) => __awaiter(this, void 0, void 0, function* () {
            this.displayBuildResults(stats);
        }));
        const client = hotClient(compiler, {
            port: this.variables.port2,
            logLevel: logLevel
        });
        let app = express();
        client.server.on('listening', () => {
            app.use(devMiddleware(compiler, {
                publicPath: this.outputPublicPath,
                logLevel: logLevel,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
            }));
            let p1 = chalk_1.default.green(this.variables.port1.toString());
            let p2 = chalk_1.default.green(this.variables.port2.toString());
            app.listen(this.variables.port1, () => {
                Shout_1.Shout.timed(chalk_1.default.yellow('Hot Reload'), `Server running on ports: ${p1}, ${p2}`);
            });
        });
    }
    setDevServerPorts() {
        return __awaiter(this, void 0, void 0, function* () {
            let genPort1 = false;
            let genPort2 = false;
            if (this.variables.port1) {
                if ((yield PortScanner_1.isPortAvailable(this.variables.port1)) === false) {
                    Shout_1.Shout.error('Configuration Error: Port 1 is not available. Randomizing Port 1...');
                    genPort1 = true;
                }
            }
            else {
                genPort1 = true;
            }
            if (genPort1) {
                this.variables.port1 = yield PortScanner_1.getAvailablePort(22001);
            }
            if (this.variables.port2) {
                if ((yield PortScanner_1.isPortAvailable(this.variables.port2)) === false) {
                    Shout_1.Shout.error('Configuration Error: Port 2 is not available. Randomizing Port 2...');
                    genPort2 = true;
                }
            }
            else {
                genPort2 = true;
            }
            if (genPort2) {
                this.variables.port2 = yield PortScanner_1.getAvailablePort(this.variables.port1 + 1);
            }
            if (this.variables.hot) {
                this.outputPublicPath = this.outputHotJsFolderUri;
            }
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.variables.hot) {
                yield this.setDevServerPorts();
            }
            let webpackConfiguration = yield this.createWebpackConfiguration();
            if (this.variables.hot) {
                this.runDevServer(webpackConfiguration);
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
