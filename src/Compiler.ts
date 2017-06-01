// Core task runner dependencies
import * as gulp from 'gulp';
import * as gutil from 'gulp-util';
import * as sourcemaps from 'gulp-sourcemaps';

// These are used by concat task
import * as concat from 'gulp-concat';
import * as es from 'event-stream';

// These are used by Browserify
import * as browserify from 'browserify';
import * as tsify from 'tsify';
import * as watchify from 'watchify';
import { HTMLify } from './HTMLify';

// These are used by CSS
import * as sass from 'gulp-sass';
import * as gwatch from 'gulp-watch';

// These are my pipes :V
import * as To from './PipeTo';

import { CompilerSettings } from './CompilerSettings';

export class Compiler {
    settings: CompilerSettings;
    productionMode: boolean;
    watchMode: boolean;

    constructor(productionMode: boolean, watchMode: boolean) {
        this.settings = CompilerSettings.tryReadFromFile();
        this.productionMode = productionMode;
        this.watchMode = watchMode;
        this.chat();
        this.registerTasks();
    }

    chat() {
        if (this.productionMode) {
            gutil.log(gutil.colors.yellow("Production"), "mode: Outputs will be minified.", gutil.colors.red("This process will slow down your build."));
        } else {
            gutil.log(gutil.colors.yellow("Development"), "mode: Outputs are", gutil.colors.red("NOT minified"), "in exchange for compilation speed.");
            gutil.log("Do not forget to minify before pushing to repository or production environment!");
        }

        if (this.watchMode) {
            gutil.log(gutil.colors.yellow("Watch"), "mode: Source codes will be automatically be compiled on changes.");
            gutil.log(gutil.colors.red("ATTENTION!"), "Concatenation task will only be run once and not watched.");
        } else {
            gutil.log("Use", gutil.colors.yellow("--watch"), "flag for switching to", gutil.colors.yellow("Watch"), "mode for automatic compilation on source changes.");
        }
    }

    registerTasks() {
        gulp.task('all', ['concat', 'js', 'css']);
        this.registerConcatTask();
        this.registerJsTask();
        this.registerCssTask();
    }

    build(taskName = 'all') {
        gulp.start(taskName);
    }

    registerJsTask() {
        let browserifyOptions: browserify.Options = {
            debug: true
        };

        if (this.watchMode) {
            browserifyOptions.cache = {};
            browserifyOptions.packageCache = {};
        }

        let jsEntry = this.settings.jsEntry;
        let jsOut = this.settings.outputJsFolder;

        let bundler = browserify(browserifyOptions).transform(HTMLify).add(jsEntry).plugin(tsify);

        let compileJs = () => {
            gutil.log('Compiling JS', gutil.colors.cyan(jsEntry));

            return bundler.bundle()
                .on('error', gutil.log)
                .pipe(To.Vinyl('bundle.js'))
                .pipe(To.Buffer())
                .pipe(To.ErrorHandler())
                .pipe(sourcemaps.init({ loadMaps: true }))
                .pipe(To.MinifyProductionJs(this.productionMode))
                .pipe(sourcemaps.write('./'))
                .pipe(To.SizeLog())
                .pipe(To.TimeLog('Finished JS compilation after'))
                .pipe(gulp.dest(jsOut));
        };

        if (this.watchMode) {
            bundler.plugin(watchify);
            bundler.on('update', compileJs);
        }

        gulp.task('js', compileJs);
    }

    registerCssTask() {
        let npm = this.settings.npmFolder;
        let cssEntry = this.settings.cssEntry;
        let cssOut = this.settings.outputCssFolder;
        let sassGlob = this.settings.cssWatchGlob;

        gulp.task('css:compile', () => {
            gutil.log('Compiling CSS', gutil.colors.cyan(cssEntry));

            let sassOptions = {
                includePaths: [npm]
            };

            return gulp.src(cssEntry)
                .pipe(To.ErrorHandler())
                .pipe(sourcemaps.init())
                .pipe(sass(sassOptions))
                .pipe(To.CssProcessors(this.productionMode))
                .pipe(sourcemaps.write('./'))
                .pipe(To.SizeLog())
                .pipe(To.TimeLog('Finished CSS compilation after'))
                .pipe(gulp.dest(cssOut));
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

    registerConcatTask() {
        gulp.task('concat', () => {
            let concatStreams = [];

            let concatCount = Object.keys(this.settings.concat).length;
            gutil.log('Resolving', gutil.colors.cyan(concatCount.toString()), 'concatenation targets...');

            if (!concatCount) {
                return;
            }

            let concatFiles = this.settings.concatResolution;
            //console.log(concatFiles);

            for (let target in concatFiles) {
                let targetFiles = concatFiles[target];
                let targetStream = gulp.src(targetFiles).pipe(concat(target));
                concatStreams.push(targetStream);
            }

            return es.merge(concatStreams)
                .pipe(To.MinifyProductionJs(this.productionMode))
                .pipe(To.SizeLog())
                .pipe(To.TimeLog('Finished JS concatenation after'))
                .pipe(gulp.dest(this.settings.outputJsFolder));
        });
    }
}
