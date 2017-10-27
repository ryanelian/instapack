// Core dependencies
import * as webpack from 'webpack';
import * as Undertaker from 'undertaker';
import * as vinyl from 'vinyl';
import * as through2 from 'through2';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as resolve from 'resolve';
import chalk from 'chalk';
import * as chokidar from 'chokidar';
import * as sourcemaps from 'gulp-sourcemaps';
import * as os from 'os';
import { tryGetTypeScriptTarget, createUglifyESOptions } from './UglifyESOptions';
import ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
import UglifyESWebpackPlugin = require('uglifyjs-webpack-plugin');

// These are my stuffs
import glog from './GulpLog';
import PipeErrorHandler from './PipeErrorHandler';
import * as To from './PipeTo';
import { Settings, ConcatLookup } from './Settings';
import { prettyBytes, prettyMilliseconds } from './PrettyUnits';

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
            glog(chalk.yellow('Parallel'), 'Mode: Build will be scaled across all logical processors.');
        }

        if (this.flags.watch) {
            glog(chalk.yellow("Watch"), "Mode: Source codes will be automatically compiled on changes.");
        }

        glog('Source Maps:', chalk.yellow(this.flags.sourceMap ? 'Enabled' : 'Disabled'));
    }

    /**
     * Creates a pipe that redirects file to output folder or a server.
     * @param folder 
     */
    output(folder: string) {
        return through2.obj(async (file: vinyl, encoding, next) => {
            if (file.isStream()) {
                let error = new Error('instapack output: Streaming is not supported!');
                return next(error);
            }

            if (file.isBuffer()) {
                let p = path.join(folder, file.relative);
                await fse.outputFile(p, file.contents);
            }

            next(null, file);
        });
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
                    path.resolve(__dirname, '../node_modules'),
                    path.resolve(__dirname, 'loaders')
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
     * Registers a JavaScript build task using TypeScript piped into Browserify.
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
     * Returns a streaming CSS project entry point as a Vinyl object. 
     */
    streamCssEntryVinyl() {
        let g = through2.obj();

        fse.readFile(this.settings.cssEntry, 'utf8').then(contents => {
            g.push(new vinyl({
                path: this.settings.cssEntry,
                contents: Buffer.from(contents),
                base: this.settings.inputCssFolder,
                cwd: this.settings.root
            }));

            g.push(null);
        });

        return g;
    }

    /**
     * Registers a CSS build task using Sass piped into postcss.
     */
    registerCssTask() {
        let cssEntry = this.settings.cssEntry;

        if (!fse.existsSync(cssEntry)) {
            this.tasks.task('css', () => {
                glog('Entry file', chalk.cyan(cssEntry), 'was not found.', chalk.red('Aborting CSS build.'));
            });
            return;
        }

        let cssMapOptions = {
            sourceRoot: '/' + this.settings.input + '/css'
        };

        this.tasks.task('css:compile', () => {
            glog('Compiling CSS', chalk.cyan(cssEntry));
            let sassImports = [this.settings.npmFolder];

            return this.streamCssEntryVinyl()
                .pipe(this.flags.sourceMap ? sourcemaps.init() : through2.obj())
                .pipe(To.Sass(this.settings.cssOut, sassImports))
                .on('error', PipeErrorHandler)
                .pipe(To.CssProcessors())
                .on('error', PipeErrorHandler)
                .pipe(this.flags.sourceMap ? sourcemaps.write('.', cssMapOptions) : through2.obj())
                .pipe(To.BuildLog('CSS build'))
                .pipe(this.output(this.settings.outputCssFolder));
        });

        this.tasks.task('css', () => {
            fse.removeSync(this.settings.outputCssSourceMap);
            let run = this.tasks.task('css:compile');
            run(error => { });

            if (this.flags.watch) {
                chokidar.watch(this.settings.scssGlob).on('change', path => {
                    run(error => { });
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
    async resolveThenConcat(paths: string[]) {
        let concat = '';

        for (let path of paths) {
            let absolute = await this.resolveAsPromise(path);
            concat += await fse.readFile(absolute, 'utf8') + '\n';
        }

        return concat;
    }

    /**
     * Returns a streaming concat results from the resolution map as Vinyl objects.
     */
    streamConcatVinyl() {
        let c = this.settings.concatCount;
        let g = through2.obj();
        let resolution = this.settings.concat;

        let countDown = () => {
            c--;
            if (c === 0) {
                g.push(null);
            }
        }

        for (let target in resolution) {
            let ar = resolution[target];
            if (!ar || ar.length === 0) {
                glog(chalk.red('WARNING'), 'concat list for', chalk.blue(target), 'is empty!');
                countDown();
                continue;
            }
            if (typeof ar === 'string') {
                ar = [ar];
                glog(chalk.red('WARNING'), 'concat list for', chalk.blue(target), 'is a', chalk.yellow('string'), 'instead of a', chalk.yellow('string[]'));
            }

            this.resolveThenConcat(ar).then(result => {
                let o = target;
                if (o.endsWith('.js') === false) {
                    o += '.js';
                }

                g.push(new vinyl({
                    path: o,
                    contents: Buffer.from(result)
                }));
            }).catch(error => {
                glog(chalk.red('ERROR'), 'when concatenating', chalk.blue(target))
                console.error(error);
            }).then(countDown); // this code block is equivalent to: .finally()
        }

        return g;
    }

    /**
     * Registers a JavaScript concat task.
     */
    registerConcatTask() {
        let c = this.settings.concatCount;
        if (c === 0) {
            this.tasks.task('concat', () => { });
            return;
        }

        this.tasks.task('concat', () => {
            if (this.flags.watch) {
                glog("Concat task will be run once and", chalk.red("NOT watched!"));
            }

            glog('Resolving', chalk.cyan(c.toString()), 'concat target(s)...');

            return this.streamConcatVinyl()
                .pipe(this.flags.production ? To.Uglify() : through2.obj())
                .on('error', PipeErrorHandler)
                .pipe(To.BuildLog('JS concat'))
                .pipe(this.output(this.settings.outputJsFolder));
        });
    }
}
