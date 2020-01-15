"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fse = require("fs-extra");
const chalk = require("chalk");
const webpack = require("webpack");
const webpackDevServer = require("webpack-dev-server");
const portfinder = require("portfinder");
const TypeScript = require("typescript");
const vue_loader_1 = require("vue-loader");
const ReactRefreshWebpackPlugin = require("@webhotelier/webpack-fast-refresh");
const CompilerResolver_1 = require("./CompilerResolver");
const Shout_1 = require("./Shout");
const PathFinder_1 = require("./variables-factory/PathFinder");
const LoaderPaths_1 = require("./loaders/LoaderPaths");
const TypescriptConfigParser_1 = require("./TypescriptConfigParser");
const InstapackBuildPlugin_1 = require("./plugins/InstapackBuildPlugin");
const TypeScriptPathsTranslator_1 = require("./TypeScriptPathsTranslator");
const UserSettingsPath_1 = require("./user-settings/UserSettingsPath");
class TypeScriptBuildEngine {
    constructor(variables) {
        this.useBabel = false;
        this.variables = variables;
        this.finder = new PathFinder_1.PathFinder(variables);
        this.typescriptCompilerOptions = TypescriptConfigParser_1.parseTypescriptConfig(variables.root, variables.typescriptConfiguration).options;
        if (this.typescriptCompilerOptions.target === TypeScript.ScriptTarget.ES3) {
            Shout_1.Shout.warning('instapack does not support targeting ES3! JS build target has been set to ES5.');
            this.typescriptCompilerOptions.target = TypeScript.ScriptTarget.ES5;
        }
        this.typescriptCompilerOptions.noEmit = false;
        this.typescriptCompilerOptions.emitDeclarationOnly = false;
        this.typescriptCompilerOptions.sourceMap = variables.sourceMap;
        this.typescriptCompilerOptions.inlineSources = variables.sourceMap;
    }
    get jsBabelWebpackRules() {
        return {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: LoaderPaths_1.LoaderPaths.babel,
                ident: 'babel-js-loader'
            }
        };
    }
    get typescriptWebpackRules() {
        const loaders = [];
        if (this.useBabel) {
            loaders.push({
                loader: LoaderPaths_1.LoaderPaths.babel,
                ident: 'babel-typescript-loader'
            });
        }
        loaders.push({
            loader: LoaderPaths_1.LoaderPaths.typescript,
            ident: 'typescript-loader',
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
                    ident: 'vue-loader',
                    options: {
                        compiler: this.vueTemplateCompiler,
                        transformAssetUrls: {},
                        appendExtension: true
                    }
                }]
        };
    }
    get htmlWebpackRules() {
        return {
            test: /\.html?$/,
            exclude: /node_modules/,
            use: [{
                    loader: LoaderPaths_1.LoaderPaths.html,
                    ident: 'html-loader'
                }]
        };
    }
    get vueCssWebpackRules() {
        const vueStyleLoader = {
            loader: LoaderPaths_1.LoaderPaths.vueStyle,
            ident: 'vue-style-loader'
        };
        const cssModulesLoader = {
            loader: LoaderPaths_1.LoaderPaths.css,
            ident: 'vue-css-module-loader',
            options: {
                modules: {
                    localIdentName: '[local]_[contenthash:8]'
                },
                url: false
            }
        };
        const cssLoader = {
            loader: LoaderPaths_1.LoaderPaths.css,
            ident: 'vue-css-loader',
            options: {
                url: false
            }
        };
        return {
            test: /\.css$/,
            resourceQuery: /\?vue/,
            oneOf: [
                {
                    resourceQuery: /module=true/,
                    use: [vueStyleLoader, cssModulesLoader]
                },
                {
                    use: [vueStyleLoader, cssLoader]
                }
            ]
        };
    }
    get reactRefreshWebpackRules() {
        return {
            test: /\.[jt]sx?$/,
            exclude: /node_modules/,
            use: {
                loader: LoaderPaths_1.LoaderPaths.babel,
                ident: 'babel-react-refresh-loader',
                options: {
                    plugins: [
                        require.resolve('@babel/plugin-syntax-dynamic-import'),
                        require.resolve('react-refresh/babel'),
                    ]
                }
            }
        };
    }
    get transpileLibrariesWebpackRules() {
        return {
            test: /\.js$/,
            include: /node_modules/,
            use: {
                loader: LoaderPaths_1.LoaderPaths.transpileLibraries,
                ident: 'js-lib-loader',
                options: {
                    compilerOptions: this.typescriptCompilerOptions
                }
            }
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
        if (this.variables.reactRefresh) {
            plugins.push(new ReactRefreshWebpackPlugin());
        }
        return plugins;
    }
    createWebpackRules() {
        const rules = [
            this.typescriptWebpackRules,
            this.vueCssWebpackRules,
            this.vueWebpackRules,
            this.htmlWebpackRules,
        ];
        if (this.useBabel) {
            rules.push(this.jsBabelWebpackRules);
        }
        if (this.typescriptCompilerOptions.target === TypeScript.ScriptTarget.ES5) {
            rules.push(this.transpileLibrariesWebpackRules);
        }
        if (this.variables.reactRefresh) {
            rules.unshift(this.reactRefreshWebpackRules);
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
        const alias = TypeScriptPathsTranslator_1.mergeTypeScriptPathAlias(this.typescriptCompilerOptions, this.finder.root, this.variables.alias);
        const wildcards = TypeScriptPathsTranslator_1.getWildcardModules(this.typescriptCompilerOptions, this.finder.root);
        const rules = this.createWebpackRules();
        const plugins = this.createWebpackPlugins();
        const webpackEntry = path.normalize(this.finder.jsEntry);
        const webpackOutputJsFolder = path.normalize(this.finder.jsOutputFolder);
        const config = {
            entry: webpackEntry,
            output: {
                filename: (data) => {
                    if (data.chunk.name === 'main') {
                        return this.finder.jsOutputFileName;
                    }
                    else {
                        return this.finder.jsChunkFileName;
                    }
                },
                chunkFilename: this.finder.jsChunkFileName,
                path: webpackOutputJsFolder,
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
                    minSize: 1,
                    maxAsyncRequests: Infinity,
                    cacheGroups: {
                        vendors: {
                            name: 'dll',
                            test: /[\\/]node_modules[\\/]/,
                            chunks: 'initial',
                            enforce: true,
                            priority: 99
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
        if (config.resolve) {
            if (wildcards) {
                config.resolve.modules = wildcards;
            }
            if (this.typescriptCompilerOptions.preserveSymlinks) {
                config.resolve.symlinks = false;
            }
        }
        return config;
    }
    getECMAScriptVersion() {
        switch (this.typescriptCompilerOptions.target) {
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
        return new Promise((ok, reject) => {
            webpack(webpackConfiguration, (err, stats) => {
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
    async runDevServer(webpackConfiguration, port) {
        if (!webpackConfiguration.output) {
            throw new Error('Unexpected undefined value: webpack configuration output object.');
        }
        const schema = this.variables.https ? 'https' : 'http';
        webpackConfiguration.output.publicPath = `${schema}://localhost:${port}/`;
        const devServerOptions = {
            hot: true,
            contentBase: false,
            port: port,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            noInfo: true,
            stats: 'none'
        };
        if (this.variables.https) {
            const certFileAsync = fse.readFile(UserSettingsPath_1.UserSettingsPath.certFile);
            const keyFileAsync = fse.readFile(UserSettingsPath_1.UserSettingsPath.keyFile);
            devServerOptions.https = {
                key: await keyFileAsync,
                cert: await certFileAsync
            };
        }
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
        await createServerTask;
        Shout_1.Shout.timed(chalk.yellow('Hot Reload'), `server running on http://localhost:${chalk.green(port)}/`);
    }
    async build() {
        this.useBabel = await fse.pathExists(this.finder.babelConfiguration);
        this.vueTemplateCompiler = await CompilerResolver_1.resolveVueTemplateCompiler(this.finder.root);
        const webpackConfiguration = this.createWebpackConfiguration();
        if (this.variables.serve) {
            let basePort = 28080;
            if (this.variables.port1) {
                basePort = this.variables.port1;
            }
            const port = await portfinder.getPortPromise({
                port: basePort
            });
            await this.runDevServer(webpackConfiguration, port);
        }
        else if (this.variables.watch) {
            await this.watch(webpackConfiguration);
        }
        else {
            const stats = await this.buildOnce(webpackConfiguration);
            if (this.variables.stats) {
                await fse.outputJson(this.finder.statsJsonFilePath, stats.toJson());
            }
        }
    }
}
exports.TypeScriptBuildEngine = TypeScriptBuildEngine;
