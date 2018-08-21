import * as upath from 'upath';
import * as path from 'path';
import * as fse from 'fs-extra';
import chalk from 'chalk';
import * as webpack from 'webpack';
import * as serve from 'webpack-serve';
import * as TypeScript from 'typescript';
import { VueLoaderPlugin } from 'vue-loader';
import * as dotenv from 'dotenv';
import * as url from 'url';

import { Settings } from './Settings';
import { prettyBytes, prettyMilliseconds } from './PrettyUnits';
import { TypeScriptBuildWebpackPlugin } from './TypeScriptBuildWebpackPlugin';
import { Shout } from './Shout';
import { getAvailablePort, isPortAvailable } from './CompilerUtilities';

/**
 * Contains methods for compiling a TypeScript project.
 */
export class TypeScriptBuildEngine {

    /**
     * Gets the project settings.
     */
    private readonly settings: Settings;

    /**
     * Gets the compiler build flags.
     */
    private readonly flags: IBuildFlags;

    port1: number;
    port2: number;

    /**
     * Constructs a new instance of TypeScriptBuildTool using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(settings: Settings, flags: IBuildFlags) {
        this.settings = settings
        this.flags = flags;
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
    private getWebpackAlias(tsCompilerOptions: TypeScript.CompilerOptions): IMapLike<string> {
        let alias: IMapLike<string> = Object.assign({}, this.settings.alias);

        if (this.flags.hot) {
            let hotClient = require.resolve('webpack-hot-client/client');
            alias['webpack-hot-client/client'] = hotClient;
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
                Shout.danger(chalk.cyan('tsconfig.json'),
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
    private getWildcardModules(tsCompilerOptions: TypeScript.CompilerOptions): string[] {
        let valid = tsCompilerOptions.baseUrl && tsCompilerOptions.paths && tsCompilerOptions.paths['*'];
        if (!valid) {
            return null;
        }

        let wildcards = tsCompilerOptions.paths['*'];
        if (!wildcards[0]) {
            Shout.warning(chalk.cyan('tsconfig.json'), 'paths:', chalk.yellow('*'), 'is empty!');
            return null;
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
                loader: 'babel-loader'
            }
        };
    }

    /**
     * Attempt to parse .env file in the project root folder!
     */
    async readEnvFile(): Promise<IMapLike<string>> {
        let env: IMapLike<string> = {};
        let dotEnvPath = this.settings.dotEnv;

        if (await fse.pathExists(dotEnvPath) === false) {
            return env;
        };

        let dotEnvRaw = await fse.readFile(dotEnvPath, 'utf8');
        let parsedEnv = dotenv.parse(dotEnvRaw);
        // console.log(parsedEnv);

        Object.assign(env, parsedEnv);
        Object.assign(env, this.flags.env);
        // console.log(env);

        return env;
    }

    /**
     * Gets a configured TypeScript rules for webpack.
     */
    createTypescriptWebpackRules(tsCompilerOptions: TypeScript.CompilerOptions, useBabel: boolean): webpack.Rule {
        let tsRules = {
            test: /\.tsx?$/,
            use: []
        };

        // webpack loaders are declared in reverse / right-to-left!
        // babel(typescript(source_code))

        if (useBabel) {
            tsRules.use.push({
                loader: 'babel-loader'
            })
        }

        tsRules.use.push({
            loader: 'core-typescript-loader',
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
                loader: 'vue-loader',
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
                loader: 'template-loader'
            }]
        };
    }

    /**
     * Gets CSS rules for webpack to prevent explosion during vue compile.
     */
    get cssWebpackRules(): webpack.Rule {
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
        return `// instapack: automatically reference the real hot-reloading script
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
        let buildTargetWarned = false;
        let compileTarget = tsCompilerOptions.target;
        if (!compileTarget) {
            compileTarget = TypeScript.ScriptTarget.ES3;
        }
        let t = TypeScript.ScriptTarget[compileTarget].toUpperCase();

        return () => {
            if (t !== 'ES5' && !buildTargetWarned) {
                Shout.danger('TypeScript compile target is not', chalk.yellow('ES5') + '!', chalk.grey('(tsconfig.json)'));
                buildTargetWarned = true;
            }
            Shout.timed('Compiling', chalk.cyan('index.ts'),
                '>', chalk.yellow(t),
                chalk.grey('in ' + this.settings.inputJsFolder + '/')
            );
        };
    }

    /**
     * Returns webpack plugins array.
     */
    async createWebpackPlugins(tsCompilerOptions: TypeScript.CompilerOptions) {
        let plugins = [];

        let onBuildStart = this.createOnBuildStartMessageDelegate(tsCompilerOptions);
        plugins.push(new TypeScriptBuildWebpackPlugin({
            onBuildStart: onBuildStart,
            minify: this.flags.production,
            sourceMap: this.flags.sourceMap
        }));

        plugins.push(new VueLoaderPlugin());

        let env = await this.readEnvFile();
        // console.log(env);
        if (Object.keys(env).length > 0) {
            plugins.push(new webpack.EnvironmentPlugin(env));
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
        if (this.flags.sourceMap === false) {
            return false;
        }

        if (this.flags.production) {
            return 'source-map';
        }

        // dev mode, faster build only during incremental compilation
        if (this.flags.watch === false) {
            return 'source-map';
        }

        return 'eval-source-map';
    }

    /**
     * Returns webpack configuration from blended instapack settings and build flags.
     */
    async createWebpackConfiguration() {
        let useBabel = await fse.pathExists(this.settings.babelConfiguration);
        let tsconfig = await this.settings.readTsConfig();
        // console.log(tsconfig.errors);
        let tsCompilerOptions = tsconfig.options;
        tsCompilerOptions.noEmit = false;
        tsCompilerOptions.sourceMap = this.flags.sourceMap;
        tsCompilerOptions.inlineSources = this.flags.sourceMap;

        let alias = this.getWebpackAlias(tsCompilerOptions);
        let wildcards = this.getWildcardModules(tsCompilerOptions);
        // console.log(alias);
        // console.log(wildcards);

        let rules = this.createWebpackRules(tsCompilerOptions, useBabel);
        let plugins = await this.createWebpackPlugins(tsCompilerOptions);

        // webpack configuration errors if using UNIX path in Windows!
        let osEntry = path.normalize(this.settings.jsEntry);
        let osOutputJsFolder = path.normalize(this.settings.outputJsFolder);
        // apparently we don't need to normalize paths for alias and wildcards.

        let config: webpack.Configuration = {
            entry: osEntry,
            output: {
                filename: this.settings.jsOut,
                chunkFilename: this.settings.jsChunkFileName,   // https://webpack.js.org/guides/code-splitting
                path: osOutputJsFolder,
                publicPath: 'js/'   // yay for using "js" folder in output!
            },
            externals: this.settings.externals,
            resolve: {
                extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.vue', '.wasm', '.json', '.html'],
                // .mjs causes runtime error when `module.exports` is being used instead of `export`.
                // .wasm requires adding `application/wasm` MIME to web server (both IIS and Kestrel).
                alias: alias
            },
            resolveLoader: {
                modules: [
                    path.resolve(__dirname, 'loaders'),             // custom internal loaders
                    path.resolve(__dirname, '../node_modules'),     // local node_modules
                    path.resolve(__dirname, '..', '..'),            // yarn's flat global node_modules
                ]
            },
            module: {
                rules: rules
            },
            mode: (this.flags.production ? 'production' : 'development'),
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

        if (wildcards) {
            config.resolve.modules = wildcards;
        }

        if (this.flags.watch) {
            config.watch = true;
            config.watchOptions = {
                ignored: /node_modules/,
                aggregateTimeout: 300
            };
        }

        if (this.flags.hot) {
            config.output.publicPath = this.outputHotJsFolderUri;
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
            chunks: false,
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

                this.displayCompileResult(stats);

                if (this.flags.watch) {
                    return; // do not terminate build worker on watch mode!
                }
                ok(stats);
            });
        }).then(stats => {
            if (this.flags.stats) {
                return fse.outputJson(this.settings.statJsonPath, stats.toJson());
            }

            return Promise.resolve();
        });
    }

    /**
     * Interact with user via CLI output when TypeScript build is finished.
     * @param stats 
     */
    displayCompileResult(stats: webpack.Stats): void {
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
        if (this.flags.hot) {
            jsOutputPath = this.outputHotJsFolderUri;
        } else {
            jsOutputPath = this.settings.outputJsFolder + '/';
        }

        for (let asset of o.assets) {
            if (asset.emitted) {
                let kb = prettyBytes(asset.size);
                Shout.timed(chalk.blue(asset.name), chalk.magenta(kb),
                    chalk.grey('in ' + jsOutputPath)
                );
            }
        }

        let t = prettyMilliseconds(o.time);
        Shout.timed('Finished JS build after', chalk.green(t));
    }

    /**
     * Create physical wormhole script in place of output JS file and dll file.
     */
    async putWormhole() {
        let dllFileName = this.settings.jsChunkFileName.replace('[name]', 'dll');
        let fileNames: string[] = [this.settings.jsOut, dllFileName];

        for (let fileName of fileNames) {
            let physicalFilePath = upath.join(this.settings.outputJsFolder, fileName);
            let hotUri = url.resolve(this.outputHotJsFolderUri, fileName);
            Shout.timed(`Creating wormhole: ${chalk.cyan(physicalFilePath)} --> ${chalk.cyan(hotUri)}`);
            let hotProxy = this.createWormholeToHotScript(hotUri);
            await fse.outputFile(physicalFilePath, hotProxy);
        }
    }

    /**
     * Gets the URI to JS folder in the hot reload server.
     */
    get outputHotJsFolderUri(): string {
        return `http://localhost:${this.port1}/js/`;
    }

    /**
     * Runs the hot reload server using provided webpack configuration. 
     * Promise will also never resolve unless errored.
     * @param webpackConfiguration 
     */
    async runDevServer(webpackConfiguration: webpack.Configuration) {
        const logLevel = 'warn';

        await this.putWormhole();

        let devServer = await serve({}, {
            config: webpackConfiguration,
            port: this.port1,
            content: path.resolve(this.settings.outputFolder),
            hotClient: {
                port: this.port2,
                logLevel: logLevel
            },
            logLevel: logLevel,
            devMiddleware: {
                publicPath: webpackConfiguration.output.publicPath,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                logLevel: logLevel
            }
        });

        devServer.on('build-finished', args => {
            this.displayCompileResult(args.stats);
        });

        await new Promise((ok, reject) => { });
    }

    /**
     * Gets host system's two open ports for Hot Reload Server then declare to UI.
     */
    async setDevServerPorts() {
        if (this.settings.port1) {
            if (await isPortAvailable(this.settings.port1)) {
                this.port1 = this.settings.port1;
            } else {
                Shout.error('Configuration Error: Port 1 is not available. Randomizing Port 1...');
            }
        }

        if (!this.port1) {
            this.port1 = await getAvailablePort(22001);
        }

        if (this.settings.port2) {
            if (this.port1 === this.settings.port2) {
                Shout.error('Configuration Error: Port 2 is equal to Port 1. Randomizing Port 2...');
            } else if (await isPortAvailable(this.settings.port2)) {
                this.port2 = this.settings.port2;
            } else {
                Shout.error('Configuration Error: Port 2 is not available. Randomizing Port 2...');
            }
        }

        if (!this.port2) {
            this.port2 = await getAvailablePort(this.port1 + 1);
        }

        let p1 = chalk.green(this.port1.toString());
        let p2 = chalk.green(this.port2.toString());
        Shout.timed(chalk.yellow('Hot Reload'), `Server running on ports: ${p1}, ${p2}`);
    }

    /**
     * Runs the TypeScript build engine.
     */
    async build() {
        if (this.flags.hot) {
            await this.setDevServerPorts();
        }

        let webpackConfiguration = await this.createWebpackConfiguration();

        if (this.flags.hot) {
            await this.runDevServer(webpackConfiguration);
        } else {
            await this.runWebpackAsync(webpackConfiguration);
        }
    }
}
