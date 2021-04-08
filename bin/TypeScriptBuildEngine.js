"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeScriptBuildEngine = void 0;
const path = require("path");
const fse = require("fs-extra");
const chalk = require("chalk");
const portfinder = require("portfinder");
const TypeScript = require("typescript");
const webpack = require("webpack");
const clean_webpack_plugin_1 = require("clean-webpack-plugin");
const webpack_plugin_serve_1 = require("webpack-plugin-serve");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const webpackPluginServeClientJS = require.resolve('webpack-plugin-serve/client');
const reactRefreshBabelPluginJS = require.resolve('react-refresh/babel');
const babelPluginDynamicImportJS = require.resolve('@babel/plugin-syntax-dynamic-import');
const resolveFrom_1 = require("./importers/resolveFrom");
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
        this.port = 28080;
        this.certificates = null;
        this.variables = variables;
        this.finder = new PathFinder_1.PathFinder(variables);
        this.typescriptCompilerOptions = TypescriptConfigParser_1.parseTypescriptConfig(variables.root, variables.typescriptConfiguration).options;
        if (!this.typescriptCompilerOptions.target) {
            Shout_1.Shout.warning('instapack does not support targeting ES3! JS build target has been set to ES5. (TypeScript compiler options)');
            this.typescriptCompilerOptions.target = TypeScript.ScriptTarget.ES5;
        }
        this.typescriptCompilerOptions.noEmit = false;
        this.typescriptCompilerOptions.emitDeclarationOnly = false;
        this.typescriptCompilerOptions.sourceMap = variables.sourceMap;
        this.typescriptCompilerOptions.inlineSources = variables.sourceMap;
    }
    get jsBabelWebpackRules() {
        return {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            use: {
                loader: LoaderPaths_1.LoaderPaths.babel,
                ident: 'babel-js'
            }
        };
    }
    get typescriptWebpackRules() {
        const loaders = [{
                loader: LoaderPaths_1.LoaderPaths.typescript,
                ident: 'typescript',
                options: {
                    compilerOptions: this.typescriptCompilerOptions
                }
            }];
        if (this.useBabel) {
            loaders.unshift({
                loader: LoaderPaths_1.LoaderPaths.babel,
                ident: 'babel-typescript'
            });
        }
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
                    loader: this.vueLoaderPath,
                    ident: 'vue',
                    options: {
                        transformAssetUrls: {}
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
                    ident: 'html-txt'
                }]
        };
    }
    get vueCssWebpackRules() {
        const cssModulesLoader = {
            loader: LoaderPaths_1.LoaderPaths.css,
            ident: 'vue-css-module',
            options: {
                esModule: false,
                modules: {
                    localIdentName: '[local]_[contenthash:8]'
                },
                url: false
            }
        };
        const cssLoader = {
            loader: LoaderPaths_1.LoaderPaths.css,
            ident: 'vue-css',
            options: {
                esModule: false,
                url: false
            }
        };
        return {
            test: /\.css$/,
            oneOf: [
                {
                    resourceQuery: /module=true/,
                    use: [MiniCssExtractPlugin.loader, cssModulesLoader]
                },
                {
                    use: [MiniCssExtractPlugin.loader, cssLoader]
                }
            ]
        };
    }
    get reactRefreshWebpackRules() {
        return {
            test: /\.[jt]sx?$/,
            exclude: /node_modules/,
            use: [{
                    loader: LoaderPaths_1.LoaderPaths.babel,
                    ident: 'react-fast-refresh-babel',
                    options: {
                        plugins: [
                            babelPluginDynamicImportJS,
                            reactRefreshBabelPluginJS,
                        ]
                    }
                }]
        };
    }
    get transpileLibrariesWebpackRules() {
        return {
            test: /\.js$/,
            include: /node_modules/,
            use: {
                loader: LoaderPaths_1.LoaderPaths.transpileLibraries,
                ident: 'js-libraries-to-es5',
                options: {
                    compilerOptions: this.typescriptCompilerOptions
                }
            }
        };
    }
    get webpackPlugins() {
        var _a;
        const plugins = [];
        const typescriptTarget = (_a = this.typescriptCompilerOptions.target) !== null && _a !== void 0 ? _a : TypeScript.ScriptTarget.ES3;
        plugins.push(new InstapackBuildPlugin_1.InstapackBuildPlugin(this.variables, typescriptTarget));
        if (this.vueLoader) {
            plugins.push(new this.vueLoader.VueLoaderPlugin());
        }
        if (Object.keys(this.variables.env).length > 0) {
            plugins.push(new webpack.EnvironmentPlugin(this.variables.env));
        }
        if (this.variables.serve) {
            plugins.push(new webpack_plugin_serve_1.WebpackPluginServe({
                host: 'localhost',
                port: this.port,
                https: this.certificates,
                progress: 'minimal',
                log: {
                    level: 'error'
                }
            }));
        }
        if (this.variables.reactRefresh) {
            plugins.push(new ReactRefreshWebpackPlugin());
        }
        if (this.variables.production) {
            plugins.push(new clean_webpack_plugin_1.CleanWebpackPlugin());
        }
        plugins.push(new MiniCssExtractPlugin({
            filename: 'ipack.jss.css',
            chunkFilename: 'ipack.[id].js.css'
        }));
        return plugins;
    }
    get webpackRules() {
        const rules = [
            this.typescriptWebpackRules,
        ];
        if (this.vueLoaderPath) {
            rules.push(this.vueCssWebpackRules);
            rules.push(this.vueWebpackRules);
        }
        rules.push(this.htmlWebpackRules);
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
        var _a;
        const entry = {
            main: {
                filename: this.finder.jsOutputFileName,
                import: [this.finder.jsEntry],
            }
        };
        if (this.variables.serve) {
            entry.main.import.push(webpackPluginServeClientJS);
        }
        const config = {
            entry: entry,
            output: {
                filename: this.finder.jsChunkFileName,
                path: path.normalize(this.finder.jsOutputFolder),
                publicPath: 'js/',
                library: this.variables.namespace,
                libraryTarget: (this.variables.umdLibraryProject ? 'umd' : undefined)
            },
            externals: this.variables.externals,
            resolve: this.webpackResolveOptions,
            plugins: this.webpackPlugins,
            module: {
                rules: this.webpackRules
            },
            mode: (this.variables.production ? 'production' : 'development'),
            devtool: this.webpackConfigurationDevTool,
            optimization: {
                emitOnErrors: false,
            },
            performance: {
                hints: false
            }
        };
        const tsTarget = (_a = this.typescriptCompilerOptions.target) !== null && _a !== void 0 ? _a : TypeScript.ScriptTarget.ES5;
        if (tsTarget < TypeScript.ScriptTarget.ES2015) {
            config.target = ['web', 'es5'];
        }
        if (!this.variables.umdLibraryProject && config.optimization) {
            config.optimization.splitChunks = {
                cacheGroups: {
                    vendors: {
                        name: 'dll',
                        test: /[\\/]node_modules[\\/]/,
                        chunks: 'initial',
                        enforce: true,
                        priority: 99
                    }
                }
            };
        }
        return config;
    }
    get webpackResolveOptions() {
        const alias = TypeScriptPathsTranslator_1.mergeTypeScriptPathAlias(this.typescriptCompilerOptions, this.finder.root, this.variables.alias);
        const wildcards = TypeScriptPathsTranslator_1.getWildcardModules(this.typescriptCompilerOptions, this.finder.root);
        if (this.variables.reactRefresh) {
            alias['react-refresh'] = [path.resolve(__dirname, '../node_modules/react-refresh')];
        }
        const config = {
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.json'],
            alias: alias
        };
        if (wildcards) {
            config.modules = wildcards;
        }
        if (this.typescriptCompilerOptions.preserveSymlinks) {
            config.symlinks = false;
        }
        return config;
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
    async build() {
        this.useBabel = await fse.pathExists(this.finder.babelConfiguration);
        if (this.variables.vue) {
            const vueLoaderPath = resolveFrom_1.resolveFrom('vue-loader', this.variables.root);
            if (vueLoaderPath) {
                this.vueLoaderPath = vueLoaderPath;
                this.vueLoader = require(vueLoaderPath);
            }
        }
        if (this.variables.serve) {
            this.port = await portfinder.getPortPromise({
                port: this.port
            });
            const host = `${this.variables.https ? 'https' : 'http'}://localhost:${chalk.greenBright(this.port)}`;
            Shout_1.Shout.timed(chalk.yellowBright('Hot Reload'), `server running on ${host}`);
        }
        if (this.variables.https) {
            const certFileAsync = fse.readFile(UserSettingsPath_1.UserSettingsPath.certFile);
            const keyFileAsync = fse.readFile(UserSettingsPath_1.UserSettingsPath.keyFile);
            this.certificates = {
                key: await keyFileAsync,
                cert: await certFileAsync
            };
        }
        const webpackConfiguration = this.createWebpackConfiguration();
        if (this.variables.watch) {
            await this.watch(webpackConfiguration);
        }
        else {
            const stats = await this.buildOnce(webpackConfiguration);
            if (this.variables.stats && stats) {
                await fse.outputJson(this.finder.statsJsonFilePath, stats.toJson());
            }
        }
    }
}
exports.TypeScriptBuildEngine = TypeScriptBuildEngine;
