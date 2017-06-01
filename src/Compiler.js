"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gulp = require("gulp");
const gutil = require("gulp-util");
const sourcemaps = require("gulp-sourcemaps");
const concat = require("gulp-concat");
const es = require("event-stream");
const browserify = require("browserify");
const tsify = require("tsify");
const watchify = require("watchify");
const HTMLify_1 = require("./HTMLify");
const sass = require("gulp-sass");
const gwatch = require("gulp-watch");
const To = require("./PipeTo");
const CompilerSettings_1 = require("./CompilerSettings");
class Compiler {
    constructor(productionMode, watchMode) {
        this.settings = CompilerSettings_1.CompilerSettings.tryReadFromFile();
        this.productionMode = productionMode;
        this.watchMode = watchMode;
        this.chat();
        this.registerTasks();
    }
    chat() {
        if (this.productionMode) {
            gutil.log(gutil.colors.yellow("Production"), "mode: Outputs will be minified.", gutil.colors.red("This process will slow down your build."));
        }
        else {
            gutil.log(gutil.colors.yellow("Development"), "mode: Outputs are", gutil.colors.red("NOT minified"), "in exchange for compilation speed.");
            gutil.log("Do not forget to minify before pushing to repository or production environment!");
        }
        if (this.watchMode) {
            gutil.log(gutil.colors.yellow("Watch"), "mode: Source codes will be automatically be compiled on changes.");
            gutil.log(gutil.colors.red("ATTENTION!"), "Concatenation task will only be run once and not watched.");
        }
        else {
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
        let browserifyOptions = {
            debug: true,
            fast: true,
        };
        if (this.watchMode) {
            browserifyOptions.cache = {};
            browserifyOptions.packageCache = {};
        }
        let jsEntry = this.settings.jsEntry;
        let jsOut = this.settings.outputJsFolder;
        let bundler = browserify(browserifyOptions).transform(HTMLify_1.HTMLify).add(jsEntry).plugin(tsify);
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
exports.Compiler = Compiler;
