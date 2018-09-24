import upath from 'upath';
import path from 'path';
import fse from 'fs-extra';
import chalk from 'chalk';
import webpack from 'webpack';
import hotClient from 'webpack-hot-client';
import devMiddleware from 'webpack-dev-middleware';
import express from 'express';
import TypeScript from 'typescript';
import { VueLoaderPlugin } from 'vue-loader';
import url from 'url';

import { prettyBytes, prettyMilliseconds } from './PrettyUnits';
import { TypeScriptBuildWebpackPlugin } from './TypeScriptBuildWebpackPlugin';
import { Shout } from './Shout';
import { getAvailablePort, isPortAvailable } from './PortScanner';
import { IVariables } from './interfaces/IVariables';
import { IMapLike } from './interfaces/IMapLike';
import { PathFinder } from './PathFinder';
import { LoaderPaths } from './loaders/LoaderPaths';
import { parseTypescriptConfig } from './TypescriptConfigParser';

/**
 * Contains methods for compiling a TypeScript project.
 */
export class TypeScriptBuildEngine {

    private readonly variables: IVariables;

    private readonly finder: PathFinder;

    private outputPublicPath: string;

    /**
     * Keep track of Hot Reload wormhole file names already created.
     */
    private readonly wormholes: Set<string> = new Set<string>();

    /**
     * Constructs a new instance of TypeScriptBuildTool using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(variables: IVariables) {
        this.variables = variables;
        this.finder = new PathFinder(variables);

        // yay for using "js" folder in output!
        this.outputPublicPath = 'js/';
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
    mergeTypeScriptPathAlias(tsCompilerOptions: TypeScript.CompilerOptions): IMapLike<string> {
        let alias: IMapLike<string> = Object.assign({}, this.variables.alias);

        if (this.variables.hot) {
            let hotClientModulePath = require.resolve('webpack-hot-client/client');
            alias['webpack-hot-client/client'] = hotClientModulePath;
            // console.log(hotClient);
        }

        if (!tsCompilerOptions.paths) {
            return alias;
        }

        if (!tsCompilerOptions.baseUrl) {
            Shout.warning(chalk.cyan('tsconfig.json'),
                'paths are defined, but baseUrl is not!',
                chalk.grey('(Ignoring)'));
            return alias;
        }

        for (let key in tsCompilerOptions.paths) {
            if (key === '*') {
                // configure this in resolve.modules instead
                continue;
            }

            // technical limitation: 1 alias = 1 path, not multiple paths...
            let values = tsCompilerOptions.paths[key];
            if (values.length > 1) {
                Shout.warning(chalk.cyan('tsconfig.json'),
                    'paths:', chalk.yellow(key), 'resolves to more than one path!',
                    chalk.grey('(Using the first one.)')
                );
            }

            let value = values[0];
            if (!value) {
                Shout.warning(chalk.cyan('tsconfig.json'), 'paths:', chalk.yellow(key), 'is empty!');
                continue;
            }

            // webpack alias does wildcard resolution automatically.
            if (key.endsWith('/*')) {
                key = key.substr(0, key.length - 2);
            }
            let result = this.convertTypeScriptPathToWebpackAliasPath(tsCompilerOptions.baseUrl, value);
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
     * @param tsCompilerOptions 
     */
    private getWildcardModules(tsCompilerOptions: TypeScript.CompilerOptions): string[] | undefined {
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
            Shout.warning(chalk.cyan('tsconfig.json'), 'paths:', chalk.yellow('*'), 'is empty!');
            return undefined;
        }

        let r = new Set<string>();

        for (let value of wildcards) {
            let result = this.convertTypeScriptPathToWebpackAliasPath(tsCompilerOptions.baseUrl, value);
            r.add(result);
        }

        r.add('node_modules');
        return Array.from(r);
    }

    /**
     * Gets JS Babel transpile rules for webpack.
     */
    get jsBabelWebpackRules(): webpack.Rule {
        return {
            test: /\.m?jsx?$/,
            exclude: /node_modules/,
            use: {
                loader: LoaderPaths.babel
            }
        };
    }

    /**
     * Gets a configured TypeScript rules for webpack.
     */
    createTypescriptWebpackRules(tsCompilerOptions: TypeScript.CompilerOptions, useBabel: boolean): webpack.Rule {
        let tsRules = {
            test: /\.tsx?$/,
            use: [] as webpack.Loader[]
        };

        // webpack loaders are declared in reverse / right-to-left!
        // babel(typescript(source_code))

        if (useBabel) {
            tsRules.use.push({
                loader: LoaderPaths.babel
            })
        }

        tsRules.use.push({
            loader: LoaderPaths.typescript,
            options: {
                compilerOptions: tsCompilerOptions
            }
        });

        return tsRules;
    }

    /**
     * Gets a Vue Single-File Component rule for webpack.
     */
    get vueWebpackRules(): webpack.Rule {
        return {
            test: /\.vue$/,
            use: [{
                loader: LoaderPaths.vue,
                options: {
                    transformAssetUrls: {},     // remove <img> src and SVG <image> xlink:href resolution
                }
            }]
        };
    }

    /**
     * Gets a configured HTML template rules for webpack.
     */
    get templatesWebpackRules(): webpack.Rule {
        return {
            test: /\.html$/,
            use: [{
                loader: LoaderPaths.template
            }]
        };
    }

    /**
     * Gets CSS rules for webpack to prevent explosion during vue compile.
     */
    get cssWebpackRules(): webpack.Rule {
        let vueStyleLoader = {
            loader: LoaderPaths.vueStyle
        };
        let cssModulesLoader = {
            loader: LoaderPaths.css,
            options: {
                modules: true,
                url: false
            }
        };
        let cssLoader = {
            loader: LoaderPaths.css,
            options: {
                url: false
            }
        };

        return {
            test: /\.css$/,
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
     * @param portNumber 
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
     * Returns a delegate which displays message when compile is starting.
     * Warns user once if target is not ES5, in tsconfig compiler options.  
     * @param tsCompilerOptions 
     */
    createOnBuildStartMessageDelegate(tsCompilerOptions: TypeScript.CompilerOptions) {
        let compileTarget = tsCompilerOptions.target;
        if (!compileTarget) {
            compileTarget = TypeScript.ScriptTarget.ES3;
        }
        let t = TypeScript.ScriptTarget[compileTarget].toUpperCase();

        return () => {
            Shout.timed('Compiling', chalk.cyan('index.ts'),
                '>', chalk.yellow(t),
                chalk.grey('in ' + this.finder.jsInputFolder + '/')
            );
        };
    }

    /**
     * Returns webpack plugins array.
     */
    createWebpackPlugins(tsCompilerOptions: TypeScript.CompilerOptions) {
        let plugins: webpack.Plugin[] = [];

        let onBuildStart = this.createOnBuildStartMessageDelegate(tsCompilerOptions);
        plugins.push(new TypeScriptBuildWebpackPlugin({
            onBuildStart: onBuildStart,
            minify: this.variables.production,
            sourceMap: this.variables.sourceMap
        }));

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
    createWebpackRules(tsCompilerOptions: TypeScript.CompilerOptions, useBabel: boolean): webpack.Rule[] {
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

    /**
     * Get the suitable webpack configuration dev tool for the job, according to instapack settings.
     */
    get webpackConfigurationDevTool() {
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
    async createWebpackConfiguration() {
        let useBabel = await fse.pathExists(this.finder.babelConfiguration);
        let tsconfig = parseTypescriptConfig(this.variables.root, this.variables.typescriptConfiguration);
        // console.log(tsconfig.errors);
        let tsCompilerOptions = tsconfig.options;
        tsCompilerOptions.noEmit = false;
        tsCompilerOptions.sourceMap = this.variables.sourceMap;
        tsCompilerOptions.inlineSources = this.variables.sourceMap;

        let alias = this.mergeTypeScriptPathAlias(tsCompilerOptions);
        let wildcards = this.getWildcardModules(tsCompilerOptions);
        // console.log(alias);
        // console.log(wildcards);

        let rules = this.createWebpackRules(tsCompilerOptions, useBabel);
        let plugins = this.createWebpackPlugins(tsCompilerOptions);

        // webpack configuration errors if using UNIX path in Windows!
        let osEntry = path.normalize(this.finder.jsEntry);
        let osOutputJsFolder = path.normalize(this.finder.jsOutputFolder);
        // apparently we don't need to normalize paths for alias and wildcards.

        let config: webpack.Configuration = {
            entry: [osEntry],
            output: {
                filename: this.finder.jsOutputFileName,
                chunkFilename: this.finder.jsChunkFileName,   // https://webpack.js.org/guides/code-splitting
                path: osOutputJsFolder,
                publicPath: this.outputPublicPath
            },
            externals: this.variables.externals,
            resolve: {
                extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.vue', '.wasm', '.json', '.html'],
                // .mjs causes runtime error when `module.exports` is being used instead of `export`.
                // .wasm requires adding `application/wasm` MIME to web server (both IIS and Kestrel).
                alias: alias
            },
            module: {
                rules: rules
            },
            mode: (this.variables.production ? 'production' : 'development'),
            devtool: this.webpackConfigurationDevTool,
            optimization: {
                minimize: false,        // https://medium.com/webpack/webpack-4-mode-and-optimization-5423a6bc597a
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

    /**
     * Runs webpack as promise. 
     * Returned Promise will **never** resolve if running on watch mode!
     * @param webpackConfiguration 
     */
    runWebpackAsync(webpackConfiguration: webpack.Configuration) {
        return new Promise<webpack.Stats>((ok, reject) => {
            webpack(webpackConfiguration, (error, stats) => {
                if (error) {
                    reject(error);
                    return;
                }

                this.displayBuildResults(stats);

                if (this.variables.watch) {
                    return; // do not terminate build worker on watch mode!
                }
                ok(stats);
            });
        }).then(stats => {
            if (this.variables.stats) {
                return fse.outputJson(this.finder.statsJsonFilePath, stats.toJson());
            }

            return Promise.resolve();
        });
    }

    /**
     * Interact with user via CLI output when TypeScript build is finished.
     * @param stats 
     */
    displayBuildResults(stats: webpack.Stats): void {
        let o = stats.toJson(this.statsSerializeEssentialOption);
        // console.log(o);

        let errors: string[] = o.errors;
        if (errors.length) {
            let errorMessage = '\n' + errors.join('\n\n') + '\n';
            console.error(chalk.red(errorMessage));
            if (errors.length === 1) {
                Shout.notify(`You have one JS build error!`);
            } else {
                Shout.notify(`You have ${errors.length} JS build errors!`);
            }
        }

        let warnings: string[] = o.warnings;
        if (warnings.length) {
            let warningMessage = '\n' + warnings.join('\n\n') + '\n';
            console.warn(chalk.yellow(warningMessage));
            if (warnings.length === 1) {
                Shout.notify(`You have one JS build warning!`);
            } else {
                Shout.notify(`You have ${warnings.length} JS build warnings!`);
            }
        }

        let jsOutputPath;
        if (this.variables.hot) {
            jsOutputPath = this.outputHotJsFolderUri;
        } else {
            jsOutputPath = this.finder.jsOutputFolder + '/';
        }

        for (let asset of o.assets) {
            if (asset.emitted) {
                let kb = prettyBytes(asset.size);
                Shout.timed(chalk.blue(asset.name), chalk.magenta(kb),
                    chalk.grey('in ' + jsOutputPath)
                );
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

        let t = prettyMilliseconds(o.time);
        Shout.timed('Finished JS build after', chalk.green(t));
    }

    /**
     * Create physical wormhole scripts for initial chunk files, once each. 
     * @param fileNames 
     */
    putWormholes(fileNames: string[]) {
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
                Shout.error(err);
            });
        }
    }

    /**
     * Create physical wormhole script in place of output file.
     */
    putWormhole(fileName: string) {
        let physicalFilePath = upath.join(this.finder.jsOutputFolder, fileName);
        let relativeFilePath = upath.relative(this.finder.root, physicalFilePath);
        let hotUri = url.resolve(this.outputHotJsFolderUri, fileName);
        Shout.timed(`+wormhole: ${chalk.cyan(relativeFilePath)} --> ${chalk.cyan(hotUri)}`);
        let hotProxy = this.createWormholeToHotScript(hotUri);
        return fse.outputFile(physicalFilePath, hotProxy);
    }

    /**
     * Gets the URI to JS folder in the hot reload server.
     */
    get outputHotJsFolderUri(): string {
        return `http://localhost:${this.variables.port1}/js/`;
    }

    /**
     * Runs the hot reload server using provided webpack configuration. 
     * Promise will also never resolve unless errored.
     * @param webpackConfiguration 
     */
    async runDevServer(webpackConfiguration: webpack.Configuration) {
        const logLevel = 'warn';

        const compiler = webpack(webpackConfiguration);
        compiler.hooks.done.tapPromise('display-build-results', async stats => {
            this.displayBuildResults(stats);
        });

        const client = hotClient(compiler, {
            port: this.variables.port2,
            logLevel: logLevel
        });

        // console.log(client);
        let app = express();

        client.server.on('listening', () => {
            app.use(devMiddleware(compiler, {
                publicPath: this.outputPublicPath,
                logLevel: logLevel,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
            }));

            let p1 = chalk.green(this.variables.port1.toString());
            let p2 = chalk.green(this.variables.port2.toString());

            app.listen(this.variables.port1, () => {
                Shout.timed(chalk.yellow('Hot Reload'), `Server running on ports: ${p1}, ${p2}`);
            });
        });

        await new Promise((ok, reject) => { });
    }

    /**
     * Gets host system's two open ports for Hot Reload Server then declare to UI.
     */
    async setDevServerPorts() {
        let genPort1 = false;
        let genPort2 = false;

        if (this.variables.port1) {
            if (await isPortAvailable(this.variables.port1) === false) {
                Shout.error('Configuration Error: Port 1 is not available. Randomizing Port 1...');
                genPort1 = true;
            }
        } else {
            genPort1 = true;
        }

        if (genPort1) {
            this.variables.port1 = await getAvailablePort(22001);
        }

        if (this.variables.port2) {
            if (await isPortAvailable(this.variables.port2) === false) {
                Shout.error('Configuration Error: Port 2 is not available. Randomizing Port 2...');
                genPort2 = true;
            }
        } else {
            genPort2 = true;
        }

        if (genPort2) {
            this.variables.port2 = await getAvailablePort(this.variables.port1 + 1);
        }

        if (this.variables.hot) {
            this.outputPublicPath = this.outputHotJsFolderUri;
        }
    }

    /**
     * Runs the TypeScript build engine.
     */
    async build() {
        if (this.variables.hot) {
            await this.setDevServerPorts();
        }

        let webpackConfiguration = await this.createWebpackConfiguration();

        if (this.variables.hot) {
            await this.runDevServer(webpackConfiguration);
        } else {
            await this.runWebpackAsync(webpackConfiguration);
        }
    }
}
