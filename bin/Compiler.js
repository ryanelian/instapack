"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const plumber = require("gulp-plumber");
const chalk = require("chalk");
const GulpLog_1 = require("./GulpLog");
const PipeErrorHandler_1 = require("./PipeErrorHandler");
const through2 = require("through2");
const vinyl = require("vinyl");
const resolve = require("resolve");
const fs = require("fs-extra");
const browserify = require("browserify");
const tsify = require("tsify");
const watchify = require("watchify");
const Templatify_1 = require("./Templatify");
const gwatch = require("gulp-watch");
const To = require("./PipeTo");
const Server_1 = require("./Server");
class Compiler {
    constructor(settings, flags) {
        this.unfuckBrowserifySourcePaths = (sourcePath, file) => {
            let folder = this.settings.input + '/js/';
            if (sourcePath.startsWith('node_modules')) {
                return '../' + sourcePath;
            }
            else if (sourcePath.startsWith(folder)) {
                return sourcePath.substring(folder.length);
            }
            else {
                return sourcePath;
            }
        };
        this.unfuckPostCssSourcePath = (sourcePath, file) => {
            if (sourcePath === 'site.css') {
                return "__PostCSS/site.css";
            }
            return sourcePath;
        };
        this.settings = settings;
        this.flags = flags;
        if (flags.serverPort) {
            this.flags.watch = true;
            this.server = new Server_1.Server(flags.serverPort);
        }
        this.chat();
        this.registerAllTasks();
    }
    chat() {
        if (this.server) {
            GulpLog_1.default(chalk.yellow("Server"), "mode: Listening on", chalk.cyan('http://localhost:' + this.server.port));
        }
        else {
            GulpLog_1.default('Using output folder', chalk.cyan(this.settings.outputFolder));
        }
        if (this.flags.minify) {
            GulpLog_1.default(chalk.yellow("Production"), "mode: Outputs will be minified.", chalk.red("This process will slow down your build!"));
        }
        else {
            GulpLog_1.default(chalk.yellow("Development"), "mode: Outputs are", chalk.red("NOT minified"), "in exchange for compilation speed.");
            GulpLog_1.default("Do not forget to minify before pushing to repository or production environment!");
        }
        if (this.flags.watch) {
            GulpLog_1.default(chalk.yellow("Watch"), "mode: Source codes will be automatically compiled on changes.");
        }
        if (!this.flags.map) {
            GulpLog_1.default(chalk.yellow("Unmap"), "mode: Source maps disabled.");
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
            GulpLog_1.default('JS entry', chalk.cyan(jsEntry), 'was not found.', chalk.red('Aborting JS build.'));
            gulp.task('js', () => { });
            return;
        }
        let browserifyOptions = {
            debug: this.flags.map
        };
        if (this.flags.watch) {
            browserifyOptions.cache = {};
            browserifyOptions.packageCache = {};
        }
        let bundler = browserify(browserifyOptions).transform(Templatify_1.default, {
            minify: this.flags.minify
        }).add(jsEntry).plugin(tsify);
        let compileJs = () => {
            GulpLog_1.default('Compiling JS', chalk.cyan(jsEntry));
            return bundler.bundle().on('error', PipeErrorHandler_1.default)
                .pipe(To.Vinyl('bundle.js'))
                .pipe(To.VinylBuffer())
                .pipe(plumber({ errorHandler: PipeErrorHandler_1.default }))
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
    registerCssTask() {
        let npm = this.settings.npmFolder;
        let cssEntry = this.settings.cssEntry;
        let sassGlob = this.settings.cssWatchGlob;
        let projectFolder = this.settings.root;
        if (!fs.existsSync(cssEntry)) {
            GulpLog_1.default('CSS entry', chalk.cyan(cssEntry), 'was not found.', chalk.red('Aborting CSS build.'));
            gulp.task('css', () => { });
            return;
        }
        gulp.task('css:compile', () => {
            GulpLog_1.default('Compiling CSS', chalk.cyan(cssEntry));
            let sassImports = [this.settings.npmFolder];
            return gulp.src(cssEntry)
                .pipe(plumber({ errorHandler: PipeErrorHandler_1.default }))
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
    needPackageRestore() {
        let hasNodeModules = fs.existsSync(this.settings.npmFolder);
        let hasPackageJson = fs.existsSync(this.settings.packageJson);
        let restore = hasPackageJson && !hasNodeModules;
        if (restore) {
            GulpLog_1.default(chalk.cyan('node_modules'), 'folder not found. Performing automatic package restore...');
        }
        return restore;
    }
    resolveAsPromise(path) {
        return new Promise((ok, reject) => {
            resolve(path, {
                basedir: this.settings.root
            }, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    ok(result);
                }
            });
        });
    }
    resolveThenConcatenate(paths) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let concat = '';
            for (let path of paths) {
                let absolute = yield this.resolveAsPromise(path);
                concat += (yield fs.readFile(absolute, 'utf8')) + '\n';
            }
            return concat;
        });
    }
    registerConcatTask() {
        let concatCount = this.settings.concatCount;
        GulpLog_1.default('Resolving', chalk.cyan(concatCount.toString()), 'concatenation targets...');
        if (concatCount === 0) {
            gulp.task('concat', undefined);
            return;
        }
        if (this.flags.watch) {
            GulpLog_1.default("Concatenation task will be run once and", chalk.red("NOT watched!"));
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
exports.Compiler = Compiler;
