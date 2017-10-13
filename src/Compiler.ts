// Core dependencies
import * as webpack from 'webpack';
import * as Undertaker from 'undertaker';
import * as vinyl from 'vinyl';
import * as through2 from 'through2';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as resolve from 'resolve';
import * as chalk from 'chalk';
import * as chokidar from 'chokidar';
import * as sourcemaps from 'gulp-sourcemaps';

// These are my stuffs
import glog from './GulpLog';
import PipeErrorHandler from './PipeErrorHandler';
import * as To from './PipeTo';
import { Settings, ConcatenationLookup } from './Settings';

/**
 * Defines build flags to be used by Compiler class.
 */
export interface CompilerFlags {
    minify: boolean,
    watch: boolean,
    map: boolean
}

/**
 * Contains methods for assembling and invoking the compilation tasks.
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
        glog('Using output folder', chalk.cyan(this.settings.outputFolder));

        if (this.flags.minify) {
            glog(chalk.yellow("Production"), "mode: Outputs will be minified.", chalk.red("This process will slow down your build!"));
        } else {
            glog(chalk.yellow("Development"), "mode: Outputs are", chalk.red("NOT minified"), "in exchange for compilation speed.");
            glog("Do not forget to minify before pushing to repository or production environment!");
        }

        if (this.flags.watch) {
            glog(chalk.yellow("Watch"), "mode: Source codes will be automatically compiled on changes.");
        }

        if (!this.flags.map) {
            glog(chalk.yellow("Unmap"), "mode: Source maps disabled.");
        }
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
        this.tasks.task('all', this.tasks.parallel('concat', 'js', 'css'));
    }

    /**
     * Runs the selected build task.
     * @param taskName 
     */
    build(taskName) {
        let run = this.tasks.task(taskName);
        run(error => { });
    }

    createWebpackConfig() {
        let tsconfigOverride = {
            noEmit: false,
            sourceMap: this.flags.map,
            module: "es2015",
            moduleResolution: "node"
        };

        let tsLoader = {
            loader: 'ts-loader',
            options: {
                compilerOptions: tsconfigOverride,
            }
        };

        let templateLoader = {
            loader: 'template-loader',
            options: {
                mode: this.settings.template
            }
        };

        let config: webpack.Configuration = {
            entry: this.settings.jsEntry,
            output: {
                filename: 'bundle.js',
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
                rules: [
                    {
                        test: /\.tsx?$/,
                        use: [tsLoader]
                    },
                    {
                        test: /\.html?$/,
                        use: [templateLoader]
                    }
                ]
            },
            plugins: [new webpack.NoEmitOnErrorsPlugin()]
        };

        if (this.flags.map) {
            config.devtool = 'source-map';
        }

        if (this.flags.minify) {
            config.plugins.push(new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': '"production"'
                }
            }));
            config.plugins.push(new webpack.optimize.UglifyJsPlugin({
                sourceMap: this.flags.map
            }));
        }

        if (this.flags.watch) {
            config.watch = true;
            config.watchOptions = {
                ignored: /node_modules/,
                aggregateTimeout: 500
            };
        }

        return config;
    }

    /**
     * Registers a JavaScript compilation task using TypeScript piped into Browserify.
     */
    registerJsTask() {
        let jsEntry = this.settings.jsEntry;

        if (!fse.existsSync(jsEntry)) {
            this.tasks.task('js', () => {
                glog('JS entry', chalk.cyan(jsEntry), 'was not found.', chalk.red('Aborting JS build.'));
            });
            return;
        }

        this.tasks.task('js', () => {
            glog('Compiling JS', chalk.cyan(jsEntry));

            let config = this.createWebpackConfig();
            webpack(config, (error, stats) => {
                if (error) {
                    console.error(error);
                }

                glog('Finished JS compilation:');

                console.log(stats.toString({
                    colors: true,
                    version: false,
                    hash: false,
                    modules: false,
                    assets: !stats.hasErrors()
                }));
            });
        });
    }

    /**
     * Pipes the CSS project entry point as a Vinyl object. 
     */
    getCssEntryVinyl() {
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
     * Registers a CSS compilation task using Sass piped into postcss.
     */
    registerCssTask() {
        let cssEntry = this.settings.cssEntry;

        if (!fse.existsSync(cssEntry)) {
            this.tasks.task('css', () => {
                glog('CSS entry', chalk.cyan(cssEntry), 'was not found.', chalk.red('Aborting CSS build.'));
            });
            return;
        }

        this.tasks.task('css:compile', () => {
            glog('Compiling CSS', chalk.cyan(cssEntry));
            let sassImports = [this.settings.npmFolder];

            return this.getCssEntryVinyl()
                .pipe(this.flags.map ? sourcemaps.init() : through2.obj())
                .pipe(To.Sass(sassImports))
                .on('error', PipeErrorHandler)
                .pipe(To.CssProcessors())
                .on('error', PipeErrorHandler)
                .pipe(this.flags.map ? sourcemaps.write('./') : through2.obj())
                .pipe(To.BuildLog('CSS compilation'))
                .pipe(this.output(this.settings.outputCssFolder));
        });

        this.tasks.task('css', () => {
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
    async resolveThenConcatenate(paths: string[]) {
        let concat = '';

        for (let path of paths) {
            let absolute = await this.resolveAsPromise(path);
            concat += await fse.readFile(absolute, 'utf8') + '\n';
        }

        return concat;
    }

    /**
     * Registers a JavaScript concatenation task.
     */
    registerConcatTask() {
        let concatCount = this.settings.concatCount;
        glog('Resolving', chalk.cyan(concatCount.toString()), 'concatenation targets...');

        if (concatCount === 0) {
            this.tasks.task('concat', () => { });
            return;
        }

        if (this.flags.watch) {
            glog("Concatenation task will be run once and", chalk.red("NOT watched!"));
        }

        this.tasks.task('concat', () => {
            let g = through2.obj();
            let resolution = this.settings.concat;

            for (let target in resolution) {
                let ar = resolution[target];
                if (!ar || ar.length === 0) {
                    glog(chalk.red('WARNING'), 'concat modules definition for', chalk.blue(target), 'is empty!');

                    concatCount--;
                    if (concatCount === 0) {
                        g.push(null);
                    }
                    continue;
                }
                if (typeof ar === 'string') {
                    ar = [ar];
                    glog(chalk.red('WARNING'), 'concat modules definition for', chalk.blue(target), 'is a', chalk.yellow('string'), 'instead of a', chalk.yellow('string[]'));
                }

                this.resolveThenConcatenate(ar).then(result => {
                    g.push(new vinyl({
                        path: target + '.js',
                        contents: Buffer.from(result)
                    }));
                }).catch(error => {
                    glog(chalk.red('ERROR'), 'when concatenating', chalk.blue(target))
                    console.log(error);
                }).then(() => {
                    // this code block is equivalent to: .finally()
                    concatCount--;
                    if (concatCount === 0) {
                        g.push(null);
                    }
                });
            }

            return g.pipe(this.flags.minify ? To.Uglify() : through2.obj())
                .on('error', PipeErrorHandler)
                .pipe(To.BuildLog('JS concatenation'))
                .pipe(this.output(this.settings.outputJsFolder));
        });
    }
}
