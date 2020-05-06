import * as path from 'path';
import * as fse from 'fs-extra';
import chalk = require('chalk');
import webpack = require('webpack');
import { WebpackPluginServe } from 'webpack-plugin-serve';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import portfinder = require('portfinder');
import * as TypeScript from 'typescript';
import { VueLoaderPlugin } from 'vue-loader';
import ReactRefreshWebpackPlugin = require('@webhotelier/webpack-fast-refresh');

import { resolveVueTemplateCompiler } from './CompilerResolver';
import { Shout } from './Shout';
import { BuildVariables } from './variables-factory/BuildVariables';
import { PathFinder } from './variables-factory/PathFinder';
import { LoaderPaths } from './loaders/LoaderPaths';
import { parseTypescriptConfig } from './TypescriptConfigParser';
import { InstapackBuildPlugin } from './plugins/InstapackBuildPlugin';
import { mergeTypeScriptPathAlias, getWildcardModules } from './TypeScriptPathsTranslator';
import { UserSettingsPath } from './user-settings/UserSettingsPath';
import type { WebpackRuleSetUseLoader } from './WebpackInternalTypes';

/**
 * Contains methods for compiling a TypeScript project.
 */
export class TypeScriptBuildEngine {

    private readonly variables: BuildVariables;

    private readonly finder: PathFinder;

    private readonly typescriptCompilerOptions: TypeScript.CompilerOptions;

    private useBabel = false;

    private vueTemplateCompiler: unknown;

    private port = 28080;

    private certificates: {
        key: Buffer;
        cert: Buffer;
    } | undefined = undefined;

    /**
     * Constructs a new instance of TypeScriptBuildTool using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(variables: BuildVariables) {
        this.variables = variables;
        this.finder = new PathFinder(variables);
        this.typescriptCompilerOptions = parseTypescriptConfig(variables.root, variables.typescriptConfiguration).options;

        if (this.typescriptCompilerOptions.target === TypeScript.ScriptTarget.ES3) {
            Shout.warning('instapack does not support targeting ES3! JS build target has been set to ES5.');
            this.typescriptCompilerOptions.target = TypeScript.ScriptTarget.ES5
        }

        this.typescriptCompilerOptions.noEmit = false;
        this.typescriptCompilerOptions.emitDeclarationOnly = false;
        this.typescriptCompilerOptions.sourceMap = variables.sourceMap;
        this.typescriptCompilerOptions.inlineSources = variables.sourceMap;
    }

    /**
     * Gets JS Babel transpile rules for webpack.
     */
    get jsBabelWebpackRules(): webpack.RuleSetRule {
        return {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: LoaderPaths.babel,
                ident: 'babel-js-loader'
            }
        };
    }

    /**
     * Gets a configured TypeScript rules for webpack.
     */
    get typescriptWebpackRules(): webpack.RuleSetRule {
        const loaders: WebpackRuleSetUseLoader[] = [];

        // webpack loaders are declared in reverse / right-to-left!
        // babel(typescript(source_code))

        if (this.useBabel) {
            loaders.push({
                loader: LoaderPaths.babel,
                ident: 'babel-typescript-loader'
            })
        }

        loaders.push({
            loader: LoaderPaths.typescript,
            ident: 'typescript-loader',
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
                ident: 'vue-loader',
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
    get htmlWebpackRules(): webpack.RuleSetRule {
        return {
            test: /\.html?$/,
            exclude: /node_modules/,
            use: [{
                loader: LoaderPaths.html,
                ident: 'html-loader'
            }]
        };
    }

    /**
     * Gets CSS rules for webpack to prevent explosion during vue compile.
     */
    get vueCssWebpackRules(): webpack.RuleSetRule {
        const vueStyleLoader: WebpackRuleSetUseLoader = {
            loader: LoaderPaths.vueStyle,
            ident: 'vue-style-loader'
        };
        // https://vue-loader.vuejs.org/guide/css-modules.html#usage
        const cssModulesLoader: WebpackRuleSetUseLoader = {
            loader: LoaderPaths.css,
            ident: 'vue-css-module-loader',
            options: {
                // enable CSS Modules
                modules: {
                    localIdentName: '[local]_[contenthash:8]'
                },
                url: false
            }
        };
        const cssLoader: WebpackRuleSetUseLoader = {
            loader: LoaderPaths.css,
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
                    // this matches <style module>
                    // ./HelloWorld.vue?vue&type=style&index=0&module=true&lang=css&
                    resourceQuery: /module=true/,
                    use: [vueStyleLoader, cssModulesLoader]
                },
                {
                    // this matches plain <style> or <style scoped>
                    // HelloWorld.vue?vue&type=style&index=0&lang=css&
                    use: [vueStyleLoader, cssLoader]
                }
            ]
        };
    }

    /**
     * Gets JS Babel transpile rules for webpack.
     */
    get reactRefreshWebpackRules(): webpack.RuleSetRule {
        return {
            test: /\.[jt]sx?$/,
            exclude: /node_modules/,
            use: {
                loader: LoaderPaths.babel,
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

    /**
     * Gets transpile libraries (to ES5) rules for webpack
     */
    get transpileLibrariesWebpackRules(): webpack.RuleSetRule {
        return {
            test: /\.js$/,
            include: /node_modules/,
            use: {
                loader: LoaderPaths.transpileLibraries,
                ident: 'js-lib-loader',
                options: {
                    compilerOptions: this.typescriptCompilerOptions
                }
            }
        };
    }

    /**
     * Gets webpack plugins array.
     */
    get webpackPlugins(): webpack.WebpackPluginInstance[] {
        const plugins: webpack.WebpackPluginInstance[] = [];

        const typescriptTarget = this.typescriptCompilerOptions.target ?? TypeScript.ScriptTarget.ES3;
        plugins.push(new InstapackBuildPlugin(this.variables, typescriptTarget));

        // webpack 5 declaration is not compatible with webpack 4 declarations!
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plugins.push(new VueLoaderPlugin() as any);

        if (Object.keys(this.variables.env).length > 0) {
            plugins.push(new webpack.EnvironmentPlugin(this.variables.env));
        }

        if (this.variables.serve) {
            plugins.push(new WebpackPluginServe({
                host: 'localhost',
                port: this.port,
                https: this.certificates,
                headers: { // https://github.com/shellscape/webpack-plugin-serve/blob/master/recipes/custom-headers.md
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-store'
                },
                progress: 'minimal',
                log: {
                    level: 'error'
                }
            }))
        }

        if (this.variables.reactRefresh) {
            plugins.push(new ReactRefreshWebpackPlugin());
        }

        if (this.variables.production) {
            plugins.push(new CleanWebpackPlugin());
        }

        return plugins;
    }

    /**
     * Gets webpack rules array using input TypeScript configuration and Babel flag.
     */
    get webpackRules(): webpack.RuleSetRule[] {
        const rules = [
            this.typescriptWebpackRules,
            this.vueCssWebpackRules,
            this.vueWebpackRules,
            this.htmlWebpackRules,  // Vue Loader Error if HTML Loader is defined before it!
        ];

        if (this.useBabel) {
            rules.push(this.jsBabelWebpackRules);
        }

        if (this.typescriptCompilerOptions.target === TypeScript.ScriptTarget.ES5) {
            rules.push(this.transpileLibrariesWebpackRules)
        }

        if (this.variables.reactRefresh) {
            // loader rules are evaluated LIFO 
            // https://stackoverflow.com/questions/32234329/what-is-the-loader-order-for-webpack
            // React Refresh Babel transformations should be done AFTER ALL other loaders!
            rules.unshift(this.reactRefreshWebpackRules);
        }

        return rules;
    }

    /**
     * Get the suitable webpack configuration dev tool for the job, according to instapack settings.
     */
    get webpackConfigurationDevTool(): false | 'hidden-source-map' | 'source-map' | 'eval-source-map' {
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
        // https://github.com/webpack/webpack/releases/tag/v5.0.0-beta.14
        const entry = {
            main: {
                filename: this.finder.jsOutputFileName,
                // webpack configuration errors if using UNIX path in Windows!
                import: [this.finder.jsEntry] as [string, ...string[]],
            }
        };

        if (this.variables.serve) {
            entry.main.import.push(require.resolve('webpack-plugin-serve/client'));
        }

        const config: webpack.Configuration = {
            entry: entry,
            output: {
                filename: this.finder.jsChunkFileName,
                path: path.normalize(this.finder.jsOutputFolder),
                publicPath: 'js/',
                library: this.variables.namespace,
                ecmaVersion: this.getECMAScriptVersion(),
                libraryTarget: 'umd'
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
                noEmitOnErrors: true
            },
            performance: { // https://webpack.js.org/configuration/performance
                hints: false
            }
        };

        if (!this.variables.umdLibraryProject && config.optimization) {
            // https://webpack.js.org/plugins/split-chunks-plugin/
            config.optimization.splitChunks = {
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
        }

        return config;
    }

    get webpackResolveOptions(): webpack.ResolveOptions {
        // apparently we don't need to normalize paths for alias and wildcards.
        const alias = mergeTypeScriptPathAlias(this.typescriptCompilerOptions, this.finder.root, this.variables.alias);
        const wildcards = getWildcardModules(this.typescriptCompilerOptions, this.finder.root);
        // console.log(alias);
        // console.log(wildcards);

        const config: webpack.ResolveOptions = {
            // .vue automatic resolution follows vue-cli behavior, although is still required in TypeScript...
            // .html module import must now be explicit!
            // .mjs causes runtime error when `module.exports` is being used instead of `export`. (Experimental in Webpack 5, requires experiments.mjs: true)
            // .wasm requires adding `application/wasm` MIME to web server (both IIS and Kestrel). (Experimental in Webpack 5, requires experiments: { asyncWebAssembly: true, importAsync: true })
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.json'],
            alias: alias
        };

        if (wildcards) {
            config.modules = wildcards;
        }

        // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-5.html#the---preservesymlinks-compiler-flag
        // This flag also exhibits the opposite behavior to Webpack’s resolve.symlinks option 
        // (TypeScript’s preserveSymlinks true === Webpack’s resolve.symlinks to false) and vice-versa.
        // https://webpack.js.org/configuration/resolve/#resolvesymlinks defaults to true
        if (this.typescriptCompilerOptions.preserveSymlinks) {
            config.symlinks = false;
        }

        return config;
    }

    getECMAScriptVersion(): number {
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

    buildOnce(webpackConfiguration: webpack.Configuration): Promise<webpack.Stats> {
        // https://github.com/webpack/changelog-v5/blob/master/README.md#compiler-idle-and-close
        // The webpack() facade automatically calls close when being passed a callback.
        return new Promise<webpack.Stats>((ok, reject) => {
            webpack(webpackConfiguration, (err, stats) => {
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
     * Runs the TypeScript build engine.
     */
    async build(): Promise<void> {
        this.useBabel = await fse.pathExists(this.finder.babelConfiguration);
        this.vueTemplateCompiler = await resolveVueTemplateCompiler(this.finder.root);

        if (this.variables.serve) {
            this.port = await portfinder.getPortPromise({
                port: this.port
            });
            const host = `${this.variables.https ? 'https' : 'http'}://localhost:${chalk.green(this.port)}`;
            Shout.timed(chalk.yellow('Hot Reload'), `server running on ${host}`);
        }

        if (this.variables.https) {
            const certFileAsync = fse.readFile(UserSettingsPath.certFile);
            const keyFileAsync = fse.readFile(UserSettingsPath.keyFile);
            // https://webpack.js.org/configuration/dev-server/#devserverhttps
            this.certificates = {
                key: await keyFileAsync,
                cert: await certFileAsync
            }
        }

        const webpackConfiguration = this.createWebpackConfiguration();

        if (this.variables.watch) {
            await this.watch(webpackConfiguration);
        } else {
            const stats = await this.buildOnce(webpackConfiguration);
            if (this.variables.stats) {
                await fse.outputJson(this.finder.statsJsonFilePath, stats.toJson());
            }
        }
    }
}
