// Core task runner dependencies
import * as gulp from 'gulp';
import * as gutil from 'gulp-util';
import * as sourcemaps from 'gulp-sourcemaps';

// These are used by concat task
import * as concat from 'gulp-concat';
import * as es from 'event-stream';
import * as resolve from 'resolve';

// These are used by Browserify
import * as browserify from 'browserify';
import * as tsify from 'tsify';
import * as watchify from 'watchify';
import { HTMLify } from './HTMLify';

// These are used by CSS
import * as gwatch from 'gulp-watch';

// These are my pipes :V
import * as To from './PipeTo';

import { Server } from './Server';
import { Settings, ConcatenationLookup } from './Settings';

/**
 * Defines build flags to be used by Compiler class.
 */
export type CompilerFlags = {
    productionMode: boolean,
    watchMode: boolean,
    serverPort: number
};

/**
 * Contains methods for assembling and invoking the compilation tasks.
 */
export class Compiler {

    /**
     * Gets the project environment settings.
     */
    readonly settings: Settings;

    /**
     * Gets the minification setting for build output.
     */
    readonly productionMode: boolean;

    /**
     * Gets the automatic build setting.
     */
    readonly watchMode: boolean;

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
        this.productionMode = flags.productionMode;
        this.watchMode = flags.watchMode;

        if (flags.serverPort) {
            this.watchMode = true;
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
            gutil.log(gutil.colors.yellow("Server"), "mode: Listening on", gutil.colors.cyan('http://localhost:' + this.server.port));
        } else {
            gutil.log('Using output folder', gutil.colors.cyan(this.settings.outputFolder));
        }

        if (this.productionMode) {
            gutil.log(gutil.colors.yellow("Production"), "mode: Outputs will be minified.", gutil.colors.red("This process will slow down your build."));
        } else {
            gutil.log(gutil.colors.yellow("Development"), "mode: Outputs are", gutil.colors.red("NOT minified"), "in exchange for compilation speed.");
            gutil.log("Do not forget to minify before pushing to repository or production environment!");
        }

        if (this.watchMode) {
            gutil.log(gutil.colors.yellow("Watch"), "mode: Source codes will be automatically compiled on changes.");
        } else {
            gutil.log("Use", gutil.colors.yellow("--watch"), "flag for switching to", gutil.colors.yellow("Watch"), "mode for automatic compilation on source changes.");
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
     * Registers a JavaScript compilation task using TypeScript piped into Browserify.
     */
    registerJsTask() {
        let browserifyOptions: browserify.Options = {
            debug: true
        };

        if (this.watchMode) {
            browserifyOptions.cache = {};
            browserifyOptions.packageCache = {};
        }

        let jsEntry = this.settings.jsEntry;
        let bundler = browserify(browserifyOptions).transform(HTMLify).add(jsEntry).plugin(tsify);

        let compileJs = () => {
            gutil.log('Compiling JS', gutil.colors.cyan(jsEntry));

            return bundler.bundle()
                .on('error', function (this: any, error) {
                    gutil.log(error);
                    this.emit('end');
                })
                .pipe(To.Vinyl('bundle.js'))
                .pipe(To.Buffer())
                .pipe(To.ErrorHandler())
                .pipe(sourcemaps.init({ loadMaps: true }))
                .pipe(To.MinifyProductionJs(this.productionMode))
                .pipe(sourcemaps.write('./'))
                .pipe(To.BuildLog('JS compilation'))
                .pipe(this.server ? this.server.Update() : gulp.dest(this.settings.outputJsFolder));
        };

        if (this.watchMode) {
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

        gulp.task('css:compile', () => {
            gutil.log('Compiling CSS', gutil.colors.cyan(cssEntry));
            let sassImports = [this.settings.npmFolder];

            return gulp.src(cssEntry)
                .pipe(To.ErrorHandler())
                .pipe(sourcemaps.init())
                .pipe(To.Sass(sassImports, projectFolder))
                .pipe(To.CssProcessors(this.productionMode))
                .pipe(sourcemaps.write('./'))
                .pipe(To.BuildLog('CSS compilation'))
                .pipe(this.server ? this.server.Update() : gulp.dest(this.settings.outputCssFolder));
        });

        let watchCallback = undefined;
        if (this.watchMode) {
            watchCallback = () => {
                return gwatch(sassGlob, () => {
                    gulp.start('css:compile');
                });
            };
        }

        gulp.task('css', ['css:compile'], watchCallback);
    }

    /**
     * Attempts to resolve modules using concat list and project folder in setting.
     */
    async resolveConcatModules(): Promise<ConcatenationLookup> {
        let resolveOption = { basedir: this.settings.root };

        let resolver: { [target: string]: Promise<string>[] } = {};
        let promises: Promise<string>[] = [];

        for (let target in this.settings.concat) {
            let resolveList = [];

            this.settings.concat[target].forEach(s => {
                let p = new Promise<string>((ok, reject) => {
                    resolve(s, resolveOption, (error, result) => {
                        if (error) {
                            reject(error)
                        } else {
                            ok(result);
                        }
                    });
                });

                resolveList.push(p);
                promises.push(p);
            });

            resolver[target] = resolveList;
        }

        // TODO: Use Object.values when using Node 8
        await Promise.all(promises);

        let resolution: ConcatenationLookup = {};

        for (let target in resolver) {
            resolution[target + '.js'] = await Promise.all(resolver[target]);
        }

        return resolution;
    }

    /**
     * Registers a JavaScript concatenation task.
     */
    registerConcatTask() {
        let concatCount = this.settings.concatCount;
        gutil.log('Resolving', gutil.colors.cyan(concatCount.toString()), 'concatenation targets...');

        let concatTask = undefined;

        if (concatCount) {
            concatTask = async () => {
                if (this.watchMode) {
                    gutil.log("Concatenation task will be run once and", gutil.colors.red("NOT watched!"));
                }

                let resolution = await this.resolveConcatModules();
                //console.log(resolution);

                let concatStreams = [];

                for (let target in resolution) {
                    let targetFiles = resolution[target];
                    let targetStream = gulp.src(targetFiles)
                        .pipe(concat(target))
                        .pipe(To.MinifyProductionJs(this.productionMode))

                    concatStreams.push(targetStream);
                }

                return es.merge(concatStreams)
                    .pipe(To.BuildLog('JS concatenation'))
                    .pipe(this.server ? this.server.Update() : gulp.dest(this.settings.outputJsFolder));
            };
        }

        gulp.task('concat', concatTask);
    }
}
