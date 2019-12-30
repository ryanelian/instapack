import * as upath from 'upath';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as url from 'url';
import chalk = require('chalk');
import webpack = require('webpack');
import webpackDevServer = require('webpack-dev-server');
import portfinder = require('portfinder');
import * as TypeScript from 'typescript';
import { VueLoaderPlugin } from 'vue-loader';
import { resolveVueTemplateCompiler } from './CompilerResolver';

import { prettyBytes, prettyMilliseconds } from './PrettyUnits';
import { Shout } from './Shout';
import { BuildVariables } from './variables-factory/BuildVariables';
import { PathFinder } from './variables-factory/PathFinder';
import { LoaderPaths } from './loaders/LoaderPaths';
import { parseTypescriptConfig } from './TypescriptConfigParser';
import { VoiceAssistant } from './VoiceAssistant';

/**
 * Contains methods for compiling a TypeScript project.
 */
export class TypeScriptBuildEngine {

    private readonly variables: BuildVariables;

    private readonly finder: PathFinder;

    private outputPublicPath = 'js/';

    private readonly typescriptCompilerOptions: TypeScript.CompilerOptions;

    private readonly languageTarget: TypeScript.ScriptTarget;

    private useBabel = false;

    private vueTemplateCompiler: unknown;

    private va: VoiceAssistant;

    /**
     * Keep track of Hot Reload wormhole file names already created.
     */
    private readonly wormholes: Set<string> = new Set<string>();

    /**
     * Constructs a new instance of TypeScriptBuildTool using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(variables: BuildVariables) {
        this.variables = variables;
        this.finder = new PathFinder(variables);
        this.va = new VoiceAssistant(variables.mute);
        this.typescriptCompilerOptions = parseTypescriptConfig(variables.root, variables.typescriptConfiguration).options;
        this.typescriptCompilerOptions.noEmit = false;
        this.typescriptCompilerOptions.emitDeclarationOnly = false;
        this.typescriptCompilerOptions.sourceMap = variables.sourceMap;
        this.typescriptCompilerOptions.inlineSources = variables.sourceMap;
        this.languageTarget = this.typescriptCompilerOptions.target || TypeScript.ScriptTarget.ES3;
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
    get jsBabelWebpackRules(): webpack.Rule {
        return {
            test: /\.(jsx?|mjs)$/,
            exclude: /node_modules/,
            use: {
                loader: LoaderPaths.babel
            }
        };
    }

    get libGuardRules(): webpack.Rule {
        return {
            test: /\.m?js$/,
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
    get typescriptWebpackRules(): webpack.Rule {
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

        const tsRules: webpack.Rule = {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: loaders
        };

        return tsRules;
    }

    /**
     * Gets a Vue Single-File Component rule for webpack.
     */
    get vueWebpackRules(): webpack.Rule {
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
    get templatesWebpackRules(): webpack.Rule {
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
    get cssWebpackRules(): webpack.Rule {
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
     * Create a fake physical source code for importing the real hot-reloading source code.
     * @param uri 
     */
    createWormholeToHotScript(uri: string): string {
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

    /**
     * Returns webpack plugins array.
     */
    createWebpackPlugins(): webpack.Plugin[] {
        const plugins: webpack.Plugin[] = [];

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
    createWebpackRules(): webpack.Rule[] {
        const rules = [
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

    /**
     * Get the suitable webpack configuration dev tool for the job, according to instapack settings.
     */
    get webpackConfigurationDevTool(): boolean | 'source-map' | 'eval-source-map' {
        if (this.variables.sourceMap === false) {
            return false;
        }

        if (this.variables.production) {
            return 'source-map';
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

        if (this.typescriptCompilerOptions.target === TypeScript.ScriptTarget.ES5) {
            if (config.output) {
                // https://github.com/webpack/changelog-v5/blob/master/MIGRATION%20GUIDE.md#disable-es2015-syntax-in-runtime-code-if-necessary
                config.output['ecmaVersion'] = 5;
            }
        }

        if (wildcards && config.resolve) {
            config.resolve.modules = wildcards;
        }

        return config;
    }

    /**
     * Get stat objects required for instapack build logs.
     */
    get statsSerializeEssentialOption(): webpack.Stats.ToJsonOptions {
        return {
            assets: true,
            cached: false,
            cachedAssets: false,
            children: false,
            chunkModules: false,
            chunkOrigins: false,
            chunks: this.variables.serve,
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

    addCompilerBuildNotification(compiler: webpack.Compiler): void {
        const t = TypeScript.ScriptTarget[this.languageTarget].toUpperCase();

        compiler.hooks.compile.tap('typescript-compile-start', () => {
            Shout.timed('Compiling', chalk.cyan('index.ts'),
                '>>', chalk.yellow(t),
                chalk.grey('in ' + this.finder.jsInputFolder + '/')
            );
        });

        if (this.variables.production) {
            compiler.hooks.compilation.tap('typescript-minify-notify', compilation => {
                // https://github.com/webpack/tapable/issues/116
                return compilation.hooks.afterHash.tap('typescript-minify-notify', () => {
                    Shout.timed('TypeScript compilation finished! Minifying bundles...');
                });
            });
        }

        compiler.hooks.done.tapPromise('display-build-results', async stats => {
            this.displayBuildResults(stats);
        });
    }

    buildOnce(webpackConfiguration: webpack.Configuration): Promise<webpack.Stats> {
        const compiler = webpack(webpackConfiguration);
        this.addCompilerBuildNotification(compiler);

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
        this.addCompilerBuildNotification(compiler);

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
     * Interact with user via CLI output when TypeScript build is finished.
     * @param stats 
     */
    displayBuildResults(stats: webpack.Stats): void {
        const o = stats.toJson(this.statsSerializeEssentialOption);
        // console.log(o);

        const errors: string[] = o.errors;
        if (errors.length) {
            const errorMessage = '\n' + errors.join('\n\n') + '\n';
            console.error(chalk.red(errorMessage));
            this.va.speak(`JAVA SCRIPT BUILD: ${errors.length} ERROR!`);
        } else {
            this.va.rewind();
        }

        const warnings: string[] = o.warnings;
        if (warnings.length) {
            const warningMessage = '\n' + warnings.join('\n\n') + '\n';
            console.warn(chalk.yellow(warningMessage));
        }

        if (o.assets) {
            for (const asset of o.assets) {
                if (asset.emitted) {
                    const kb = prettyBytes(asset.size);
                    const where = 'in ' + (this.variables.serve ? this.outputPublicPath : this.finder.jsOutputFolder);
                    Shout.timed(chalk.blue(asset.name), chalk.magenta(kb), chalk.grey(where));
                }
            }
        }

        if (this.variables.serve && o.chunks) {
            for (const chunk of o.chunks) {
                if (chunk.initial === false) {
                    continue;
                }

                this.putWormholes(chunk.files);
            }
        }

        if (o.time) {
            const t = prettyMilliseconds(o.time);
            Shout.timed('Finished JS build after', chalk.green(t));
        } else {
            Shout.timed('Finished JS build.');
        }
    }

    /**
     * Create physical wormhole scripts for initial chunk files, once each. 
     * @param fileNames 
     */
    putWormholes(fileNames: string[]): void {
        if (!fileNames) {
            return;
        }

        for (const file of fileNames) {
            if (file.includes('.hot-update.js')) {
                continue;
            }

            if (this.wormholes.has(file)) {
                continue;
            }

            this.putWormhole(file).then(() => {
                this.wormholes.add(file);
            }).catch(err => {
                Shout.error(err);
            });
        }
    }

    /**
     * Create physical wormhole script in place of output file.
     */
    putWormhole(fileName: string): Promise<void> {
        const physicalFilePath = upath.join(this.finder.jsOutputFolder, fileName);
        const relativeFilePath = upath.relative(this.finder.root, physicalFilePath);
        const hotUri = url.resolve(this.outputPublicPath, fileName);
        Shout.timed(`+wormhole: ${chalk.cyan(relativeFilePath)} --> ${chalk.cyan(hotUri)}`);
        const hotProxy = this.createWormholeToHotScript(hotUri);
        return fse.outputFile(physicalFilePath, hotProxy);
    }

    /**
     * Runs the hot reload server using provided webpack configuration.
     * @param webpackConfiguration 
     */
    async runDevServer(webpackConfiguration: webpack.Configuration): Promise<void> {
        let basePort = 28080;
        if (this.variables.port1) {
            basePort = this.variables.port1;
        }
        const port = await portfinder.getPortPromise({
            port: basePort
        });
        this.outputPublicPath = `http://localhost:${port}/`;

        if (!webpackConfiguration.output) {
            throw new Error('Unexpected undefined value: webpack configuration output object.');
        }
        webpackConfiguration.output.publicPath = this.outputPublicPath;

        const devServerOptions: webpackDevServer.Configuration = {
            hot: true,
            contentBase: false,                     // don't serve static files from project folder LOL
            port: port,                             // for some reason, WDS not using port from listen() parameter
            headers: {                              // CORS
                'Access-Control-Allow-Origin': '*'
            },
            noInfo: true
        };

        webpackDevServer.addDevServerEntrypoints(webpackConfiguration, devServerOptions);
        const compiler = webpack(webpackConfiguration);
        this.addCompilerBuildNotification(compiler);

        const devServer = new webpackDevServer(compiler, devServerOptions);

        return new Promise<void>((ok, reject) => {
            // 'localhost' parameter MUST be written, otherwise error callback WILL NOT work! 
            devServer.listen(port, 'localhost', error => {
                if (error) {
                    reject(error);
                    return;
                }

                Shout.timed(chalk.yellow('Hot Reload'), `Server running on http://localhost:${chalk.green(port)}/`);
                ok();
            });
        });
    }

    /**
     * Runs the TypeScript build engine.
     */
    async build(): Promise<void> {
        this.useBabel = await fse.pathExists(this.finder.babelConfiguration);
        this.vueTemplateCompiler = await resolveVueTemplateCompiler(this.finder.root);
        const webpackConfiguration = this.createWebpackConfiguration();

        if (this.variables.serve) {
            await this.runDevServer(webpackConfiguration);
        } else if (this.variables.watch) {
            await this.watch(webpackConfiguration);
        } else {
            const stats = await this.buildOnce(webpackConfiguration);
            if (this.variables.stats) {
                await fse.outputJson(this.finder.statsJsonFilePath, stats.toJson());
            }
        }
    }
}
