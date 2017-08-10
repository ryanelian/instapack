// Core task runner dependencies
import * as gulp from 'gulp';
import * as sourcemaps from 'gulp-sourcemaps';
import * as plumber from 'gulp-plumber';
import * as chalk from 'chalk';

import glog from './GulpLog';
import PipeErrorHandler from './PipeErrorHandler';

// These are used by concat task
import * as through2 from 'through2';
import * as vinyl from 'vinyl';
import * as resolve from 'resolve';
import * as fs from 'fs-extra';

// These are used by Browserify
import * as browserify from 'browserify';
import * as tsify from 'tsify';
import * as watchify from 'watchify';
import templatify from './Templatify';

// These are used by CSS
import * as gwatch from 'gulp-watch';

// These are my pipes :V
import * as To from './PipeTo';

import { Server } from './Server';
import { Settings, ConcatenationLookup } from './Settings';

/**
 * Defines build flags to be used by Compiler class.
 */
export interface CompilerFlags {
    minify: boolean,
    watch: boolean,
    map: boolean,
    serverPort: number
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
     * Gets the build server instance.
     */
    readonly server: Server;

    /**
     * Constructs a new instance of Compiler using specified build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(settings: Settings, flags: CompilerFlags) {
        this.settings = settings;
        this.flags = flags;

        if (flags.serverPort) {
            this.flags.watch = true;
            this.server = new Server(flags.serverPort);
        }

        this.chat();
        this.registerAllTasks();
    }

    /**
     * Displays information about currently used build flags.
     */
    chat() {
        if (this.server) {
            glog(chalk.yellow("Server"), "mode: Listening on", chalk.cyan('http://localhost:' + this.server.port));
        } else {
            glog('Using output folder', chalk.cyan(this.settings.outputFolder));
        }

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
     * Registers all available tasks and registers a task for invoking all those tasks.
     */
    registerAllTasks() {
        gulp.task('all', ['concat', 'js', 'css']);
        this.registerConcatTask();
        this.registerJsTask();
        this.registerCssTask();
    }

    /**
     * Runs the selected build task.
     * @param taskName 
     */
    build(taskName) {
        gulp.start(taskName);
    }

    /**
     * Flattens abyssmal sourcemap paths resulting from Browserify compilation.
     */
    unfuckBrowserifySourcePaths = (sourcePath: string, file) => {
        let folder = this.settings.input + '/js/';

        if (sourcePath.startsWith('node_modules')) {
            return '../' + sourcePath;
        } else if (sourcePath.startsWith(folder)) {
            return sourcePath.substring(folder.length);
        } else {
            return sourcePath;
        }
    }

    /**
     * Hides a phantom sourcemap resulting from PostCSS compilation into a folder.
     */
    unfuckPostCssSourcePath = (sourcePath: string, file) => {
        if (sourcePath === 'site.css') {
            // TODO: Find a way to destroy this source map completely...
            return "__PostCSS/site.css";
        }
        return sourcePath;
    }

    /**
     * Registers a JavaScript compilation task using TypeScript piped into Browserify.
     */
    registerJsTask() {
        let jsEntry = this.settings.jsEntry;

        if (!fs.existsSync(jsEntry)) {
            glog('JS entry', chalk.cyan(jsEntry), 'was not found.', chalk.red('Aborting JS build.'));
            gulp.task('js', () => { });
            return;
        }

        let browserifyOptions: browserify.Options = {
            debug: this.flags.map
        };

        if (this.flags.watch) {
            browserifyOptions.cache = {};
            browserifyOptions.packageCache = {};
        }

        let bundler = browserify(browserifyOptions).transform(templatify, {
            minify: this.flags.minify
        }).add(jsEntry).plugin(tsify);

        let compileJs = () => {
            glog('Compiling JS', chalk.cyan(jsEntry));

            return bundler.bundle().on('error', PipeErrorHandler)
                .pipe(To.Vinyl('bundle.js'))
                .pipe(To.VinylBuffer())
                .pipe(plumber({ errorHandler: PipeErrorHandler }))
                .pipe(this.flags.map ? sourcemaps.init({ loadMaps: true }) : through2.obj())
                .pipe(this.flags.minify ? To.Uglify() : through2.obj())
                .pipe(this.flags.map ? sourcemaps.mapSources(this.unfuckBrowserifySourcePaths) : through2.obj())
                .pipe(this.flags.map ? sourcemaps.write('./') : through2.obj())
                .pipe(To.BuildLog('JS compilation'))
                .pipe(this.server ? this.server.Update() : gulp.dest(this.settings.outputJsFolder));
        };

        if (this.flags.watch) {
            bundler.plugin(watchify);
            bundler.on('update', compileJs);
        }

        gulp.task('js', compileJs);
    }

    /**
     * Registers a CSS compilation task using Sass piped into postcss.
     */
    registerCssTask() {
        let npm = this.settings.npmFolder;
        let cssEntry = this.settings.cssEntry;
        let sassGlob = this.settings.cssWatchGlob;
        let projectFolder = this.settings.root;

        if (!fs.existsSync(cssEntry)) {
            glog('CSS entry', chalk.cyan(cssEntry), 'was not found.', chalk.red('Aborting CSS build.'));
            gulp.task('css', () => { });
            return;
        }

        gulp.task('css:compile', () => {
            glog('Compiling CSS', chalk.cyan(cssEntry));
            let sassImports = [this.settings.npmFolder];

            return gulp.src(cssEntry)
                .pipe(plumber({ errorHandler: PipeErrorHandler }))
                .pipe(this.flags.map ? sourcemaps.init() : through2.obj())
                .pipe(To.Sass(sassImports))
                .pipe(To.CssProcessors(this.flags.minify))
                .pipe(this.flags.map ? sourcemaps.mapSources(this.unfuckPostCssSourcePath) : through2.obj())
                .pipe(this.flags.map ? sourcemaps.write('./') : through2.obj())
                .pipe(To.BuildLog('CSS compilation'))
                .pipe(this.server ? this.server.Update() : gulp.dest(this.settings.outputCssFolder));
        });

        let watchCallback = undefined;
        if (this.flags.watch) {
            watchCallback = () => {
                return gwatch(sassGlob, () => {
                    gulp.start('css:compile');
                });
            };
        }

        gulp.task('css', ['css:compile'], watchCallback);
    }

    /**
     * Returns true when package.json exists in project root folder but node_modules folder is missing.
     */
    needPackageRestore() {
        let hasNodeModules = fs.existsSync(this.settings.npmFolder);
        let hasPackageJson = fs.existsSync(this.settings.packageJson);

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
            concat += await fs.readFile(absolute, 'utf8') + '\n';
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
            gulp.task('concat', undefined);
            return;
        }

        if (this.flags.watch) {
            glog("Concatenation task will be run once and", chalk.red("NOT watched!"));
        }

        gulp.task('concat', () => {
            let g = through2.obj();
            let resolution = this.settings.concat;

            for (let target in resolution) {
                this.resolveThenConcatenate(resolution[target]).then(result => {
                    g.push(new vinyl({
                        path: target + '.js',
                        contents: Buffer.from(result)
                    }));

                    concatCount--;
                    if (concatCount === 0) {
                        g.push(null);
                    }
                });
            }

            return g.pipe(this.flags.minify ? To.Uglify() : through2.obj())
                .pipe(To.BuildLog('JS concatenation'))
                .pipe(this.server ? this.server.Update() : gulp.dest(this.settings.outputJsFolder));
        });
    }
}
