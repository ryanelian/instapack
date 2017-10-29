// Node.js Core
import * as path from 'path';
import * as fse from 'fs-extra';
import * as os from 'os';

// Tasks
import * as Undertaker from 'undertaker';
import chalk from 'chalk';
import * as chokidar from 'chokidar';

// Sass + PostCSS
import * as sass from 'node-sass';
import * as postcss from 'postcss';
import * as autoprefixer from 'autoprefixer';
import * as discardComments from 'postcss-discard-comments';

// webpack
import * as webpack from 'webpack';
import { tryGetTypeScriptTarget, createUglifyESOptions } from './UglifyESOptions';
import ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
import UglifyESWebpackPlugin = require('uglifyjs-webpack-plugin');

// concat
import * as resolve from 'resolve';
import * as UglifyES from 'uglify-es';

// These are my stuffs
import glog from './GulpLog';
import { Settings, ConcatLookup } from './Settings';
import { prettyBytes, prettyMilliseconds, prettyHrTime } from './PrettyUnits';
import { prettyError } from './PrettyObject';

/**
 * Defines build flags to be used by Compiler class.
 */
export interface CompilerFlags {
    production: boolean,
    watch: boolean,
    sourceMap: boolean,
    parallel: boolean
}

/**
 * A simple key-value pair for UglifyES code input.
 */
export interface ConcatFiles {
    [name: string]: string
}

/**
 * Contains methods for assembling and invoking the build tasks.
 */
export class Compiler {

    /**
     * Gets the project environment settings.
     */
    readonly settings: Settings;

    /**
     * Gets the compiler build flags.
     */
    readonly flags: CompilerFlags;

    /**
     * Gets the task registry.
     */
    readonly tasks: Undertaker;

    /**
     * Constructs a new instance of Compiler using specified build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(settings: Settings, flags: CompilerFlags) {
        this.settings = settings;
        this.flags = flags;
        this.tasks = new Undertaker();

        this.chat();
        this.registerAllTasks();
    }

    /**
     * Displays information about currently used build flags.
     */
    chat() {
        glog('Output to folder', chalk.cyan(this.settings.outputFolder));

        if (this.flags.production) {
            glog(chalk.yellow("Production"), "Mode: Outputs will be minified.", chalk.red("(Slow build)"));
        } else {
            glog(chalk.yellow("Development"), "Mode: Outputs will", chalk.red("NOT be minified!"), "(Fast build)");
            glog(chalk.red("Do not forget to minify"), "before pushing to repository or production server!");
        }

        if (this.flags.parallel) {
            glog(chalk.yellow('Parallel'), 'Mode: Build will be scaled across all CPU threads!');
        }

        if (this.flags.watch) {
            glog(chalk.yellow("Watch"), "Mode: Source codes will be automatically compiled on changes.");
        }

        glog('Source Maps:', chalk.yellow(this.flags.sourceMap ? 'Enabled' : 'Disabled'));
    }

    /**
     * Registers all available tasks and registers a task for invoking all those tasks.
     */
    registerAllTasks() {
        this.registerConcatTask();
        this.registerJsTask();
        this.registerCssTask();
        this.tasks.task('all', this.tasks.parallel('js', 'css', 'concat'));
    }

    /**
     * Runs the selected build task.
     * @param taskName 
     */
    build(taskName) {
        let run = this.tasks.task(taskName);
        run(error => { });
    }

    /**
     * Returns a pre-configured loader array with optional cache and parallel capability.
     * @param cached 
     */
    getParallelLoaders(cached: boolean) {
        let loaders = [];

        if (this.flags.parallel) {
            if (cached) {
                loaders.push({
                    loader: 'cache-loader',
                    options: {
                        cacheDirectory: this.settings.cacheFolder
                    }
                });
            }

            loaders.push({
                loader: 'thread-loader',
                options: {
                    workers: os.cpus().length - 1
                }
            });
        }

        return loaders;
    }

    /**
     * Returns a configured TypeScript rules for webpack.
     */
    getTypeScriptWebpackRules() {
        let loaders = this.getParallelLoaders(true);

        loaders.push({
            loader: 'ts-loader',
            options: {
                compilerOptions: {
                    noEmit: false,
                    sourceMap: this.flags.sourceMap,
                    moduleResolution: "node"
                },
                onlyCompileBundledFiles: true,
                transpileOnly: this.flags.parallel,
                happyPackMode: this.flags.parallel
            }
        });

        return {
            test: /\.tsx?$/,
            use: loaders
        };
    }

    /**
     * Returns a configured HTML template rules for webpack.
     */
    getTemplatesWebpackRules() {
        let loaders = this.getParallelLoaders(false);

        loaders.push({
            loader: 'template-loader',
            options: {
                mode: this.settings.template
            }
        });

        return {
            test: /\.html?$/,
            use: loaders
        };
    }

    /**
     * Returns a configured webpack plugins.
     */
    getWebpackPlugins() {
        let plugins = [];
        plugins.push(new webpack.NoEmitOnErrorsPlugin());

        if (this.flags.parallel) {
            plugins.push(new ForkTsCheckerWebpackPlugin({
                checkSyntacticErrors: true,
                async: false,
                silent: true,
                watch: this.settings.inputJsFolder
            }));
        }

        if (this.flags.production) {
            plugins.push(new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify('production')
                }
            }));
            plugins.push(new UglifyESWebpackPlugin({
                sourceMap: this.flags.sourceMap,
                parallel: this.flags.parallel,
                uglifyOptions: createUglifyESOptions()
            }));
        }

        return plugins;
    }

    /**
     * Gets a webpack configuration from blended instapack configuration and build flags.
     */
    get webpackConfiguration() {
        let config: webpack.Configuration = {
            entry: this.settings.jsEntry,
            output: {
                filename: this.settings.jsOut,
                path: this.settings.outputJsFolder
            },
            externals: this.settings.externals,
            resolve: {
                extensions: ['.js', '.ts', '.tsx', '.htm', '.html'],
                alias: this.settings.alias
            },
            resolveLoader: {
                modules: [
                    path.resolve(__dirname, 'loaders'),         // custom internal loaders
                    path.resolve(__dirname, '../node_modules'), // local node_modules
                    path.resolve(__dirname, '..', '..'),        // yarn's flat global node_modules
                ]
            },
            module: {
                rules: [this.getTypeScriptWebpackRules(), this.getTemplatesWebpackRules()]
            },
            plugins: this.getWebpackPlugins()
        };

        if (this.flags.sourceMap) {
            config.devtool = (this.flags.production ? 'source-map' : 'eval-source-map');
        }

        if (this.flags.watch) {
            config.watch = true;
            config.watchOptions = {
                ignored: /node_modules/,
                aggregateTimeout: 300
            };
        }

        return config;
    }

    /**
     * Gets webpack stat render options for colored warnings and errors.
     */
    get webpackStatsErrorsOnly() {
        return {
            colors: true,
            assets: false,
            cached: false,
            children: false,
            chunks: false,
            errors: true,
            hash: false,
            modules: false,
            reasons: false,
            source: false,
            timings: false,
            version: false,
            warnings: true
        } as webpack.Stats.ToStringOptions;
    }

    /**
     * Gets webpack stat extraction options for assets and build time only.  
     */
    get webpackStatsJsonMinimal() {
        return {
            assets: true,
            cached: false,
            children: false,
            chunks: false,
            errors: false,
            hash: false,
            modules: false,
            reasons: false,
            source: false,
            timings: true,
            version: false,
            warnings: false
        } as webpack.Stats.ToJsonOptions;
    }

    /**
     * Registers a JavaScript build task using TypeScript + webpack.
     */
    registerJsTask() {
        let jsEntry = this.settings.jsEntry;

        if (!fse.existsSync(jsEntry)) {
            this.tasks.task('js', () => {
                glog('Entry file', chalk.cyan(jsEntry), 'was not found.', chalk.red('Aborting JS build.'));
            });
            return;
        }

        this.tasks.task('js', () => {
            fse.removeSync(this.settings.outputJsSourceMap);
            glog('Compiling JS >', chalk.yellow(tryGetTypeScriptTarget()), chalk.cyan(jsEntry));

            webpack(this.webpackConfiguration, (error, stats) => {
                if (error) {
                    glog(chalk.red('FATAL ERROR'), 'during JS build:');
                    console.error(error);
                    return;
                }

                let o = stats.toJson(this.webpackStatsJsonMinimal);

                if (stats.hasErrors() || stats.hasWarnings()) {
                    console.log(stats.toString(this.webpackStatsErrorsOnly));
                }

                for (let asset of o.assets) {
                    if (asset.emitted) {
                        let kb = prettyBytes(asset.size);
                        glog(chalk.blue(asset.name), chalk.magenta(kb));
                    }
                }

                let t = prettyMilliseconds(o.time);
                glog('Finished JS build after', chalk.green(t));
            });
        });
    }

    /**
     * Asynchronously compiles Sass as a Promise.
     * @param options 
     */
    compileSassAsync(options: sass.Options) {
        return new Promise<sass.Result>((ok, reject) => {
            sass.render(options, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    ok(result);
                }
            });
        });
    }

    /**
     * Logs file output and writes to output directory as a UTF-8 encoded string.
     * @param filePath 
     * @param content 
     */
    logAndWriteUtf8FileAsync(filePath: string, content: string) {
        let bundle = Buffer.from(content, 'utf8');
        let name = path.basename(filePath)
        let size = prettyBytes(bundle.length);

        glog(chalk.blue(name), chalk.magenta(size));
        return fse.writeFile(filePath, bundle);
    }

    /**
     * Builds CSS project asynchronously.
     */
    async buildCSS() {
        let cssEntry = this.settings.cssEntry;

        // E:\VS\TAM.Passport\TAM.Passport\client\css\site.scss --> E:\VS\TAM.Passport\TAM.Passport\client\css\ipack.css
        let outFile = path.join(path.dirname(cssEntry), this.settings.cssOut);

        let sassOptions: sass.Options = {
            file: cssEntry,
            outFile: outFile,
            data: await fse.readFile(cssEntry, 'utf8'),
            includePaths: [this.settings.npmFolder],

            outputStyle: (this.flags.production ? 'compressed' : 'expanded'),
            sourceMap: this.flags.sourceMap,
            sourceMapEmbed: this.flags.sourceMap,
            sourceMapContents: this.flags.sourceMap,
        };

        let sassResult = await this.compileSassAsync(sassOptions);

        let plugins: any[] = [autoprefixer];
        if (this.flags.production) {
            plugins.push(discardComments({
                removeAll: true
            }));
        }

        let postCssSourceMapOption: postcss.SourceMapOptions = null;
        if (this.flags.sourceMap) {
            postCssSourceMapOption = {
                inline: false
            };
        }

        let cssOutPath = this.settings.outputCssFile;
        let cssResult = await postcss(plugins).process(sassResult.css, {
            from: outFile,
            to: cssOutPath,
            map: postCssSourceMapOption
        });

        let t1 = this.logAndWriteUtf8FileAsync(cssOutPath, cssResult.css);
        if (cssResult.map) {
            await this.logAndWriteUtf8FileAsync(cssOutPath + '.map', cssResult.map.toString());
        }
        await t1;
    }

    /**
     * Registers a CSS build task using Sass + postcss.
     */
    registerCssTask() {
        let cssEntry = this.settings.cssEntry;

        if (!fse.existsSync(cssEntry)) {
            this.tasks.task('css', () => {
                glog('Entry file', chalk.cyan(cssEntry), 'was not found.', chalk.red('Aborting CSS build.'));
            });
            return;
        }

        this.tasks.task('css:build', async () => {
            let start = process.hrtime();
            try {
                await this.buildCSS();
            }
            catch (error) {
                console.error(prettyError(error));
            }
            finally {
                let time = prettyHrTime(process.hrtime(start));
                glog('Finished CSS build after', chalk.green(time));
            }
        });

        this.tasks.task('css', () => {
            fse.removeSync(this.settings.outputCssSourceMap);

            glog('Compiling CSS', chalk.cyan(cssEntry));
            let run = this.tasks.task('css:build');

            run(error => {
                glog(chalk.red('FATAL ERROR'), 'during CSS build:');
                console.error(error);
            });

            if (this.flags.watch) {
                chokidar.watch(this.settings.scssGlob).on('change', path => {
                    run(error => {
                        glog(chalk.red('FATAL ERROR'), 'during CSS build:');
                        console.error(error);
                    });
                });
            }
        });
    }

    /**
     * Returns true when package.json exists in project root folder but node_modules folder is missing.
     */
    get needPackageRestore() {
        let hasNodeModules = fse.existsSync(this.settings.npmFolder);
        let hasPackageJson = fse.existsSync(this.settings.packageJson);

        let restore = hasPackageJson && !hasNodeModules;

        if (restore) {
            glog(chalk.cyan('node_modules'), 'folder not found. Performing automatic package restore...');
        }

        return restore;
    }

    /**
     * Attempts to resolve a module using node resolution logic, relative to project folder path, asynchronously.
     * @param path 
     */
    resolveAsPromise(path: string) {
        return new Promise<string>((ok, reject) => {
            resolve(path, {
                basedir: this.settings.root
            }, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    ok(result);
                }
            });
        });
    }

    /**
     * Returns a promise for a concatenated file content as string, resulting from a list of node modules.
     * @param paths 
     */
    async resolveThenReadFiles(paths: string[]) {
        let p1 = paths.map(Q => this.resolveAsPromise(Q));
        let resolutions = await Promise.all(p1);
        let p2 = resolutions.map(Q => fse.readFile(Q, 'utf8'));
        let contents = await Promise.all(p2);

        let files: ConcatFiles = {};

        for (let i = 0; i < resolutions.length; i++) {
            let key = path.relative(this.settings.root, resolutions[i]);
            key = '/' + key.replace(/\\/g, '/');
            // console.log(resolutions[i] + ' ' + key);
            files[key] = contents[i];
        }

        return files;
    }

    /**
     * Accepts a file name and a list of files to be concatenated using UglifyES as asynchronous Promise with minify result.
     * @param target 
     * @param files 
     */
    concatFilesAsync(target: string, files: ConcatFiles) {
        let options = createUglifyESOptions();
        if (!this.flags.production) {
            options.output = {
                beautify: true
            }
            options['compress'] = false;
            options['mangle'] = false;
        }
        if (this.flags.sourceMap) {
            options.sourceMap = {
                filename: target,
                url: target + '.map',
                // root: 'instapack://',
                includeSources: true
            };
        }

        return new Promise<any>((ok, error) => {
            let result = UglifyES.minify(files, options);
            if (result.error) {
                error(result.error)
            } else {
                ok(result);
            }
        });
    }

    /**
     * Accepts a file name and a list of node modules relative to the root project path.
     * @param target 
     * @param modules 
     */
    async concatTarget(target: string, modules: string[]) {
        let files = await this.resolveThenReadFiles(modules);
        let result = await this.concatFilesAsync(target, files);

        let outPath = path.join(this.settings.outputJsFolder, target);
        let p1 = this.logAndWriteUtf8FileAsync(outPath, result.code);
        if (result.map) {
            await this.logAndWriteUtf8FileAsync(outPath + '.map', result.map);
        }
        await p1;
    }

    /**
     * Returns a Promise which resolves when all concatenation tasks have been completed.
     */
    buildConcat() {
        let tasks: Promise<void>[] = [];
        let targets = this.settings.concat;

        for (let target in targets) {
            let modules = targets[target];
            if (!modules || modules.length === 0) {
                glog(chalk.red('WARNING'), 'concat list for', chalk.blue(target), 'is empty!');
                continue;
            }
            if (typeof modules === 'string') {
                modules = [modules];
                glog(chalk.red('WARNING'), 'concat list for', chalk.blue(target), 'is a', chalk.yellow('string'), 'instead of a', chalk.yellow('string[]'));
            }

            let o = target;
            if (o.endsWith('.js') === false) {
                o += '.js';
            }

            let task = this.concatTarget(o, modules).catch(error => {
                glog(chalk.red('ERROR'), 'when concatenating', chalk.blue(o));
                console.error(error);
            }).then(/* finally: Promise will never throw any errors! */() => { });

            tasks.push(task);
        }

        return Promise.all(tasks);
    }

    /**
     * Registers a JavaScript concat task using UglifyES.
     */
    registerConcatTask() {
        let c = this.settings.concatCount;
        if (c === 0) {
            this.tasks.task('concat', () => { });
            return;
        }

        this.tasks.task('concat', async () => {
            if (this.flags.watch) {
                glog("Concat task will be run once and", chalk.red("NOT watched!"));
            }

            glog('Resolving', chalk.cyan(c.toString()), 'concat target(s)...');
            let start = process.hrtime();
            try {
                await this.buildConcat();
            }
            finally {
                let time = prettyHrTime(process.hrtime(start));
                glog('Finished JS concat after', chalk.green(time));
            }
        });
    }
}
