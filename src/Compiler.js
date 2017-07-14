"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const gulp = require("gulp");
const gutil = require("gulp-util");
const sourcemaps = require("gulp-sourcemaps");
const concat = require("gulp-concat");
const es = require("event-stream");
const resolve = require("resolve");
const fs = require("fs-extra");
const browserify = require("browserify");
const tsify = require("tsify");
const watchify = require("watchify");
const HTMLify_1 = require("./HTMLify");
const gwatch = require("gulp-watch");
const To = require("./PipeTo");
const Server_1 = require("./Server");
class Compiler {
    constructor(settings, flags) {
        this.settings = settings;
        this.productionMode = flags.productionMode;
        this.watchMode = flags.watchMode;
        if (flags.serverPort) {
            this.watchMode = true;
            this.server = new Server_1.Server(flags.serverPort);
        }
        this.chat();
        this.registerAllTasks();
    }
    chat() {
        if (this.server) {
            gutil.log(gutil.colors.yellow("Server"), "mode: Listening on", gutil.colors.cyan('http://localhost:' + this.server.port));
        }
        else {
            gutil.log('Using output folder', gutil.colors.cyan(this.settings.outputFolder));
        }
        if (this.productionMode) {
            gutil.log(gutil.colors.yellow("Production"), "mode: Outputs will be minified.", gutil.colors.red("This process will slow down your build."));
        }
        else {
            gutil.log(gutil.colors.yellow("Development"), "mode: Outputs are", gutil.colors.red("NOT minified"), "in exchange for compilation speed.");
            gutil.log("Do not forget to minify before pushing to repository or production environment!");
        }
        if (this.watchMode) {
            gutil.log(gutil.colors.yellow("Watch"), "mode: Source codes will be automatically compiled on changes.");
        }
        else {
            gutil.log("Use", gutil.colors.yellow("--watch"), "flag for switching to", gutil.colors.yellow("Watch"), "mode for automatic compilation on source changes.");
        }
    }
    registerAllTasks() {
        gulp.task('all', ['concat', 'js', 'css']);
        this.registerConcatTask();
        this.registerJsTask();
        this.registerCssTask();
    }
    build(taskName) {
        gulp.start(taskName);
    }
    registerJsTask() {
        let jsEntry = this.settings.jsEntry;
        if (!fs.existsSync(jsEntry)) {
            gutil.log('JS entry', gutil.colors.cyan(jsEntry), 'was not found.', gutil.colors.red('Aborting JS build.'));
            gulp.task('js', () => { });
            return;
        }
        let browserifyOptions = {
            debug: true
        };
        if (this.watchMode) {
            browserifyOptions.cache = {};
            browserifyOptions.packageCache = {};
        }
        let bundler = browserify(browserifyOptions).transform(HTMLify_1.HTMLify).add(jsEntry).plugin(tsify);
        let compileJs = () => {
            gutil.log('Compiling JS', gutil.colors.cyan(jsEntry));
            return bundler.bundle()
                .on('error', function (error) {
                gutil.log(error);
                this.emit('end');
            })
                .pipe(To.Vinyl('bundle.js'))
                .pipe(To.VinylBuffer())
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
    registerCssTask() {
        let npm = this.settings.npmFolder;
        let cssEntry = this.settings.cssEntry;
        let sassGlob = this.settings.cssWatchGlob;
        let projectFolder = this.settings.root;
        if (!fs.existsSync(cssEntry)) {
            gutil.log('CSS entry', gutil.colors.cyan(cssEntry), 'was not found.', gutil.colors.red('Aborting CSS build.'));
            gulp.task('css', () => { });
            return;
        }
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
    needPackageRestore() {
        let hasNodeModules = fs.existsSync(this.settings.npmFolder);
        let hasPackageJson = fs.existsSync(this.settings.packageJson);
        let restore = hasPackageJson && !hasNodeModules;
        if (restore) {
            gutil.log(gutil.colors.cyan('node_modules'), 'folder not found. Performing automatic package restore...');
        }
        return restore;
    }
    resolveConcatModules() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let resolveOption = { basedir: this.settings.root };
            let resolver = {};
            let promises = [];
            for (let target in this.settings.concat) {
                let resolveList = [];
                this.settings.concat[target].forEach(s => {
                    let p = new Promise((ok, reject) => {
                        resolve(s, resolveOption, (error, result) => {
                            if (error) {
                                reject(error);
                            }
                            else {
                                ok(result);
                            }
                        });
                    });
                    resolveList.push(p);
                    promises.push(p);
                });
                resolver[target] = resolveList;
            }
            yield Promise.all(promises);
            let resolution = {};
            for (let target in resolver) {
                resolution[target + '.js'] = yield Promise.all(resolver[target]);
            }
            return resolution;
        });
    }
    registerConcatTask() {
        let concatCount = this.settings.concatCount;
        gutil.log('Resolving', gutil.colors.cyan(concatCount.toString()), 'concatenation targets...');
        let concatTask = undefined;
        if (concatCount) {
            concatTask = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                if (this.watchMode) {
                    gutil.log("Concatenation task will be run once and", gutil.colors.red("NOT watched!"));
                }
                let resolution = yield this.resolveConcatModules();
                let concatStreams = [];
                for (let target in resolution) {
                    let targetFiles = resolution[target];
                    let targetStream = gulp.src(targetFiles)
                        .pipe(concat(target))
                        .pipe(To.MinifyProductionJs(this.productionMode));
                    concatStreams.push(targetStream);
                }
                return es.merge(concatStreams)
                    .pipe(To.BuildLog('JS concatenation'))
                    .pipe(this.server ? this.server.Update() : gulp.dest(this.settings.outputJsFolder));
            });
        }
        gulp.task('concat', concatTask);
    }
}
exports.Compiler = Compiler;
