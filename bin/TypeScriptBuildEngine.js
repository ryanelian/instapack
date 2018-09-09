"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upath_1 = __importDefault(require("upath"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const webpack_1 = __importDefault(require("webpack"));
const webpack_serve_1 = __importDefault(require("webpack-serve"));
const typescript_1 = __importDefault(require("typescript"));
const vue_loader_1 = require("vue-loader");
const url_1 = __importDefault(require("url"));
const PrettyUnits_1 = require("./PrettyUnits");
const TypeScriptBuildWebpackPlugin_1 = require("./TypeScriptBuildWebpackPlugin");
const Shout_1 = require("./Shout");
const PortScanner_1 = require("./PortScanner");
const PathFinder_1 = require("./PathFinder");
class TypeScriptBuildEngine {
    constructor(variables) {
        this.wormholes = new Set();
        this.variables = variables;
        this.finder = new PathFinder_1.PathFinder(variables);
        this.outputPublicPath = 'js/';
        if (this.variables.hot) {
            this.outputPublicPath = this.outputHotJsFolderUri;
        }
    }
    convertTypeScriptPathToWebpackAliasPath(baseUrl, value) {
        let result = upath_1.default.join(baseUrl, value);
        if (result.endsWith('/*')) {
            result = result.substr(0, result.length - 2);
        }
        return result;
    }
    mergeTypeScriptPathAlias(tsCompilerOptions) {
        let alias = Object.assign({}, this.variables.alias);
        if (this.variables.hot) {
            let hotClient = require.resolve('webpack-hot-client/client');
            alias['webpack-hot-client/client'] = hotClient;
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
                loader: 'babel-loader'
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
        let buildTargetWarned = false;
        let compileTarget = tsCompilerOptions.target;
        if (!compileTarget) {
            compileTarget = typescript_1.default.ScriptTarget.ES3;
        }
        let t = typescript_1.default.ScriptTarget[compileTarget].toUpperCase();
        return () => {
            if (t !== 'ES5' && !buildTargetWarned) {
                Shout_1.Shout.danger('TypeScript compile target is not', chalk_1.default.yellow('ES5') + '!', chalk_1.default.grey('(tsconfig.json)'));
                buildTargetWarned = true;
            }
            Shout_1.Shout.timed('Compiling', chalk_1.default.cyan('index.ts'), '>', chalk_1.default.yellow(t), chalk_1.default.grey('in ' + this.finder.jsInputFolder + '/'));
        };
    }
    createWebpackPlugins(tsCompilerOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            let plugins = [];
            let onBuildStart = this.createOnBuildStartMessageDelegate(tsCompilerOptions);
            plugins.push(new TypeScriptBuildWebpackPlugin_1.TypeScriptBuildWebpackPlugin({
                onBuildStart: onBuildStart,
                minify: this.variables.production,
                sourceMap: this.variables.sourceMap
            }));
            plugins.push(new vue_loader_1.VueLoaderPlugin());
            if (Object.keys(this.variables.env).length > 0) {
                plugins.push(new webpack_1.default.EnvironmentPlugin(this.variables.env));
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
            let useBabel = yield fs_extra_1.default.pathExists(this.finder.babelConfiguration);
            let tsconfig = yield this.finder.readTsConfig();
            let tsCompilerOptions = tsconfig.options;
            tsCompilerOptions.noEmit = false;
            tsCompilerOptions.sourceMap = this.variables.sourceMap;
            tsCompilerOptions.inlineSources = this.variables.sourceMap;
            let alias = this.mergeTypeScriptPathAlias(tsCompilerOptions);
            let wildcards = this.getWildcardModules(tsCompilerOptions);
            let rules = this.createWebpackRules(tsCompilerOptions, useBabel);
            let plugins = yield this.createWebpackPlugins(tsCompilerOptions);
            let osEntry = path_1.default.normalize(this.finder.jsEntry);
            let osOutputJsFolder = path_1.default.normalize(this.finder.jsOutputFolder);
            let config = {
                entry: osEntry,
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
                resolveLoader: {
                    modules: [
                        path_1.default.resolve(__dirname, 'loaders'),
                        path_1.default.resolve(__dirname, '../node_modules'),
                        path_1.default.resolve(__dirname, '..', '..'),
                    ]
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
            if (this.variables.watch) {
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
    runWebpackAsync(webpackConfiguration) {
        return new Promise((ok, reject) => {
            webpack_1.default(webpackConfiguration, (error, stats) => {
                if (error) {
                    reject(error);
                    return;
                }
                this.displayCompileResult(stats);
                if (this.variables.watch) {
                    return;
                }
                ok(stats);
            });
        }).then(stats => {
            if (this.variables.stats) {
                return fs_extra_1.default.outputJson(this.finder.statsJsonFilePath, stats.toJson());
            }
            return Promise.resolve();
        });
    }
    displayCompileResult(stats) {
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
        let physicalFilePath = upath_1.default.join(this.finder.jsOutputFolder, fileName);
        let hotUri = url_1.default.resolve(this.outputHotJsFolderUri, fileName);
        Shout_1.Shout.timed(`+wormhole: ${chalk_1.default.cyan(physicalFilePath)} --> ${chalk_1.default.cyan(hotUri)}`);
        let hotProxy = this.createWormholeToHotScript(hotUri);
        return fs_extra_1.default.outputFile(physicalFilePath, hotProxy);
    }
    get outputHotJsFolderUri() {
        return `http://localhost:${this.variables.port1}/js/`;
    }
    runDevServer(webpackConfiguration) {
        return __awaiter(this, void 0, void 0, function* () {
            const logLevel = 'warn';
            let devServer = yield webpack_serve_1.default({}, {
                config: webpackConfiguration,
                port: this.variables.port1,
                content: this.finder.outputFolderPath,
                hotClient: {
                    port: this.variables.port2,
                    logLevel: logLevel
                },
                logLevel: logLevel,
                devMiddleware: {
                    publicPath: this.outputPublicPath,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    logLevel: logLevel
                }
            });
            devServer.on('build-finished', args => {
                this.displayCompileResult(args.stats);
            });
            yield new Promise((ok, reject) => { });
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
            let p1 = chalk_1.default.green(this.variables.port1.toString());
            let p2 = chalk_1.default.green(this.variables.port2.toString());
            Shout_1.Shout.timed(chalk_1.default.yellow('Hot Reload'), `Server running on ports: ${p1}, ${p2}`);
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.variables.hot) {
                yield this.setDevServerPorts();
            }
            let webpackConfiguration = yield this.createWebpackConfiguration();
            if (this.variables.hot) {
                yield this.runDevServer(webpackConfiguration);
            }
            else {
                yield this.runWebpackAsync(webpackConfiguration);
            }
        });
    }
}
exports.TypeScriptBuildEngine = TypeScriptBuildEngine;
