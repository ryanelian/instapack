import * as path from 'path';
import * as upath from 'upath';
import * as fse from 'fs-extra';
import chalk = require('chalk');
import webpack = require('webpack');
import webpackDevServer = require('webpack-dev-server');
import portfinder = require('portfinder');
import * as TypeScript from 'typescript';
import { VueLoaderPlugin } from 'vue-loader';

import { resolveVueTemplateCompiler } from './CompilerResolver';
import { Shout } from './Shout';
import { BuildVariables } from './variables-factory/BuildVariables';
import { PathFinder } from './variables-factory/PathFinder';
import { LoaderPaths } from './loaders/LoaderPaths';
import { parseTypescriptConfig } from './TypescriptConfigParser';
import { InstapackBuildPlugin } from './plugins/InstapackBuildPlugin';

/**
 * Contains methods for compiling a TypeScript project.
 */
export class TypeScriptBuildEngine {

    private readonly variables: BuildVariables;

    private readonly finder: PathFinder;

    private readonly typescriptCompilerOptions: TypeScript.CompilerOptions;

    private useBabel = false;

    private vueTemplateCompiler: unknown;

    /**
     * Constructs a new instance of TypeScriptBuildTool using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(variables: BuildVariables) {
        this.variables = variables;
        this.finder = new PathFinder(variables);
        this.typescriptCompilerOptions = parseTypescriptConfig(variables.root, variables.typescriptConfiguration).options;
        this.typescriptCompilerOptions.noEmit = false;
        this.typescriptCompilerOptions.emitDeclarationOnly = false;
        this.typescriptCompilerOptions.sourceMap = variables.sourceMap;
        this.typescriptCompilerOptions.inlineSources = variables.sourceMap;
    }

    /**
     * A simple helper function for resolving TypeScript paths, trimming * from the rightmost path.
     * @param baseUrl 
     * @param value 
     */
    private convertTypeScriptPathToWebpackAliasPath(baseUrl: string, value: string): string {
        let result = upath.join(baseUrl, value);
        if (result.endsWith('/*')) {
            result = result.substr(0, result.length - 2);
        }

        // console.log(baseUrl, value, JSON.stringify(result));
        return result;
    }

    /**
     * Translates tsconfig.json paths into webpack-compatible aliases!
     */
    mergeTypeScriptPathAlias(): MapLikeObject<string> {
        const alias: MapLikeObject<string> = Object.assign({}, this.variables.alias);

        if (!this.typescriptCompilerOptions.paths) {
            return alias;
        }

        if (!this.typescriptCompilerOptions.baseUrl) {
            Shout.warning(chalk.cyan('tsconfig.json'),
                'paths are defined, but baseUrl is not!',
                chalk.grey('(Ignoring)'));
            return alias;
        }

        for (let key in this.typescriptCompilerOptions.paths) {
            if (key === '*') {
                // configure this in resolve.modules instead
                continue;
            }

            // technical limitation: 1 alias = 1 path, not multiple paths...
            const values = this.typescriptCompilerOptions.paths[key];
            if (values.length > 1) {
                Shout.warning(chalk.cyan('tsconfig.json'),
                    'paths:', chalk.yellow(key), 'resolves to more than one path!',
                    chalk.grey('(Using the first one.)')
                );
            }

            const value = values[0];
            if (!value) {
                Shout.warning(chalk.cyan('tsconfig.json'), 'paths:', chalk.yellow(key), 'is empty!');
                continue;
            }

            // webpack alias does wildcard resolution automatically.
            if (key.endsWith('/*')) {
                key = key.substr(0, key.length - 2);
            }
            const result = this.convertTypeScriptPathToWebpackAliasPath(this.typescriptCompilerOptions.baseUrl, value);
            // console.log(key, " ", result);

            // don't let the merge overrides user-defined aliases!
            if (!alias[key]) {
                alias[key] = result;
            }
        }

        return alias;
    }

    /**
     * Returns lookup folders for non-relative module imports, from TypeScript * paths. 
     */
    private getWildcardModules(): string[] | undefined {
        if (!this.typescriptCompilerOptions.baseUrl) {
            return undefined;
        }

        const r = new Set<string>();
        const p = this.typescriptCompilerOptions.paths;

        if (p && p['*']) {
            for (const value of p['*']) {
                const result = this.convertTypeScriptPathToWebpackAliasPath(this.typescriptCompilerOptions.baseUrl, value);
                r.add(result);
            }
        } else {
            r.add(this.typescriptCompilerOptions.baseUrl);
        }

        r.add('node_modules');
        return Array.from(r);
    }

    /**
     * Gets JS Babel transpile rules for webpack.
     */
    get jsBabelWebpackRules(): webpack.RuleSetRule {
        return {
            test: /\.js$/,
            use: {
                loader: LoaderPaths.babel
            }
        };
    }

    get libGuardRules(): webpack.RuleSetRule {
        return {
            test: /\.js$/,
            include: /node_modules/,
            use: [{
                loader: LoaderPaths.libGuard,
                options: {
                    compilerOptions: this.typescriptCompilerOptions
                }
            }]
        };
    }

    /**
     * Gets a configured TypeScript rules for webpack.
     */
    get typescriptWebpackRules(): webpack.RuleSetRule {
        const loaders: webpack.Loader[] = [];

        // webpack loaders are declared in reverse / right-to-left!
        // babel(typescript(source_code))

        if (this.useBabel) {
            loaders.push({
                loader: LoaderPaths.babel
            })
        }

        loaders.push({
            loader: LoaderPaths.typescript,
            options: {
                compilerOptions: this.typescriptCompilerOptions
            }
        });

        const tsRules: webpack.RuleSetRule = {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: loaders
        };

        return tsRules;
    }

    /**
     * Gets a Vue Single-File Component rule for webpack.
     */
    get vueWebpackRules(): webpack.RuleSetRule {
        return {
            test: /\.vue$/,
            exclude: /node_modules/,
            use: [{
                loader: LoaderPaths.vue,
                options: {
                    compiler: this.vueTemplateCompiler,
                    transformAssetUrls: {},     // remove <img> src and SVG <image> xlink:href resolution
                    appendExtension: true
                }
            }]
        };
    }

    /**
     * Gets a configured HTML template rules for webpack.
     */
    get templatesWebpackRules(): webpack.RuleSetRule {
        return {
            test: /\.html?$/,
            exclude: /node_modules/,
            use: [{
                loader: LoaderPaths.template,
                options: {
                    attrs: false
                }
            }]
        };
    }

    /**
     * Gets CSS rules for webpack to prevent explosion during vue compile.
     */
    get cssWebpackRules(): webpack.RuleSetRule {
        const vueStyleLoader = {
            loader: LoaderPaths.vueStyle
        };
        const cssModulesLoader = {
            loader: LoaderPaths.css,
            options: {
                modules: true,
                localIdentName: '[local]_[hash:base64:5]',
                url: false
            }
        };
        const cssLoader = {
            loader: LoaderPaths.css,
            options: {
                url: false
            }
        };

        return {
            test: /\.css$/,
            exclude: /node_modules/,
            oneOf: [
                { // this matches <style module>
                    resourceQuery: /module/,
                    use: [vueStyleLoader, cssModulesLoader]
                }, { // this matches plain <style> or <style scoped>
                    use: [vueStyleLoader, cssLoader]
                }]
        };
    }

    /**
     * Returns webpack plugins array.
     */
    createWebpackPlugins(): webpack.Plugin[] {
        const plugins: webpack.Plugin[] = [];

        const typescriptTarget = this.typescriptCompilerOptions.target ?? TypeScript.ScriptTarget.ES3;
        plugins.push(new InstapackBuildPlugin(this.variables, typescriptTarget));

        plugins.push(new VueLoaderPlugin());

        if (Object.keys(this.variables.env).length > 0) {
            plugins.push(new webpack.EnvironmentPlugin(this.variables.env));
        }

        return plugins;
    }

    /**
     * Returns webpack rules array using input TypeScript configuration and Babel flag.
     * @param tsCompilerOptions 
     * @param useBabel 
     */
    createWebpackRules(): webpack.RuleSetRule[] {
        const rules = [
            this.typescriptWebpackRules,
            this.vueWebpackRules,
            this.templatesWebpackRules,
            this.cssWebpackRules
        ];

        // loader rules are evaluated LIFO 
        // https://stackoverflow.com/questions/32234329/what-is-the-loader-order-for-webpack
        // meaning, LibGuard should run first before Babel!
        if (this.useBabel) {
            rules.push(this.jsBabelWebpackRules);
        }

        if (this.typescriptCompilerOptions.target) {
            // TypeScript module transpilation is effectively off when target is ESNext
            if (this.typescriptCompilerOptions.target < TypeScript.ScriptTarget.ESNext) {
                rules.push(this.libGuardRules);
            }
        }

        return rules;
    }

    /**
     * Get the suitable webpack configuration dev tool for the job, according to instapack settings.
     */
    get webpackConfigurationDevTool(): boolean | 'hidden-source-map' | 'source-map' | 'eval-source-map' {
        if (this.variables.sourceMap === false) {
            return false;
        }

        if (this.variables.production) {
            return 'hidden-source-map';
        }

        // dev mode, faster build only during incremental compilation
        if (this.variables.watch === false) {
            return 'source-map';
        }

        return 'eval-source-map';
    }

    /**
     * Returns webpack configuration from blended instapack settings and build flags.
     */
    createWebpackConfiguration(): webpack.Configuration {
        const alias = this.mergeTypeScriptPathAlias();
        const wildcards = this.getWildcardModules();
        // console.log(alias);
        // console.log(wildcards);

        const rules = this.createWebpackRules();
        const plugins = this.createWebpackPlugins();

        // webpack configuration errors if using UNIX path in Windows!
        const osEntry = path.normalize(this.finder.jsEntry);
        const osOutputJsFolder = path.normalize(this.finder.jsOutputFolder);
        // apparently we don't need to normalize paths for alias and wildcards.

        const config: webpack.Configuration = {
            entry: [osEntry],
            output: {
                filename: (chunkData): string => {
                    if (chunkData.chunk.name === 'main') {
                        return this.finder.jsOutputFileName;
                    } else {
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
                // .vue automatic resolution follows vue-cli behavior, although is still required in TypeScript...
                // .html module import must now be explicit!
                // .mjs causes runtime error when `module.exports` is being used instead of `export`. (Experimental in Webpack 5, requires experiments.mjs: true)
                // .wasm requires adding `application/wasm` MIME to web server (both IIS and Kestrel). (Experimental in Webpack 5, requires experiments: { asyncWebAssembly: true, importAsync: true })
                alias: alias
            },
            module: {
                rules: rules
            },
            mode: (this.variables.production ? 'production' : 'development'),
            devtool: this.webpackConfigurationDevTool,
            optimization: {     // https://medium.com/webpack/webpack-4-mode-and-optimization-5423a6bc597a
                noEmitOnErrors: true,   // https://dev.to/flexdinesh/upgrade-to-webpack-4---5bc5
                splitChunks: {          // https://webpack.js.org/plugins/split-chunks-plugin/
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
                hints: false    // https://webpack.js.org/configuration/performance
            },
            plugins: plugins
        };

        if (config.output) {
            // https://webpack.js.org/configuration/output/#outputecmaversion
            config.output['ecmaVersion'] = this.getECMAScriptVersion();
        }

        if (wildcards && config.resolve) {
            config.resolve.modules = wildcards;
        }

        return config;
    }

    getECMAScriptVersion(): number {
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

    buildOnce(webpackConfiguration: webpack.Configuration): Promise<webpack.Stats> {
        const compiler = webpack(webpackConfiguration);
        return new Promise<webpack.Stats>((ok, reject) => {
            compiler.run((err, stats) => {
                if (err) {
                    reject(err);
                }

                ok(stats);
            });
        });
    }

    watch(webpackConfiguration: webpack.Configuration): Promise<void> {
        const compiler = webpack(webpackConfiguration);
        return new Promise<void>((ok, reject) => {
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

    /**
     * Runs the hot reload server using provided webpack configuration.
     * @param webpackConfiguration 
     */
    async runDevServer(webpackConfiguration: webpack.Configuration, port: number): Promise<void> {
        const devServerOptions: webpackDevServer.Configuration = {
            hot: true,
            contentBase: false,     // don't serve static files from project folder LOL
            port: port,             // for some reason, WDS not using port from listen() parameter
            headers: {              // CORS
                'Access-Control-Allow-Origin': '*'
            },
            noInfo: true
        };

        webpackDevServer.addDevServerEntrypoints(webpackConfiguration, devServerOptions);
        const compiler = webpack(webpackConfiguration);
        const devServer = new webpackDevServer(compiler, devServerOptions);

        const createServerTask = new Promise<void>((ok, reject) => {
            // 'localhost' parameter MUST be written, otherwise error callback WILL NOT work! 
            devServer.listen(port, 'localhost', error => {
                if (error) {
                    reject(error);
                    return;
                }

                ok();
            });
        });

        await createServerTask;
        Shout.timed(chalk.yellow('Hot Reload'), `server running on http://localhost:${chalk.green(port)}/`);
    }

    /**
     * Runs the TypeScript build engine.
     */
    async build(): Promise<void> {
        this.useBabel = await fse.pathExists(this.finder.babelConfiguration);
        this.vueTemplateCompiler = await resolveVueTemplateCompiler(this.finder.root);
        const webpackConfiguration = this.createWebpackConfiguration();

        if (this.variables.serve) {
            let basePort = 28080;
            if (this.variables.port1) {
                basePort = this.variables.port1;
            }
            const port = await portfinder.getPortPromise({
                port: basePort
            });

            if (!webpackConfiguration.output) {
                throw new Error('Unexpected undefined value: webpack configuration output object.');
            }
            webpackConfiguration.output.publicPath = `http://localhost:${port}/`;
            await this.runDevServer(webpackConfiguration, port);
        } else if (this.variables.watch) {
            await this.watch(webpackConfiguration);
        } else {
            const stats = await this.buildOnce(webpackConfiguration);
            if (this.variables.stats && this.variables.production) {
                await fse.outputJson(this.finder.statsJsonFilePath, stats.toJson());
            }
        }
    }
}
