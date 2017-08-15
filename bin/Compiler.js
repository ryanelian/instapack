"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Undertaker = require("undertaker");
const vinyl = require("vinyl");
const through2 = require("through2");
const fse = require("fs-extra");
const path = require("path");
const resolve = require("resolve");
const chalk = require("chalk");
const chokidar = require("chokidar");
const sourcemaps = require("gulp-sourcemaps");
const GulpLog_1 = require("./GulpLog");
const PipeErrorHandler_1 = require("./PipeErrorHandler");
const To = require("./PipeTo");
const Server_1 = require("./Server");
const browserify = require("browserify");
const tsify = require("tsify");
const watchify = require("watchify");
const Templatify_1 = require("./Templatify");
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
        this.tasks = new Undertaker();
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
    output(folder) {
        return through2.obj((file, encoding, next) => __awaiter(this, void 0, void 0, function* () {
            if (file.isBuffer()) {
                if (this.server) {
                    yield this.server.Update(file.relative, file.contents);
                }
                else {
                    let p = path.join(folder, file.relative);
                    yield fse.outputFile(p, file.contents);
                }
            }
            next(null, file);
        }));
    }
    registerAllTasks() {
        this.registerConcatTask();
        this.registerJsTask();
        this.registerCssTask();
        this.tasks.task('all', this.tasks.parallel('concat', 'js', 'css'));
    }
    build(taskName) {
        let run = this.tasks.task(taskName);
        run(error => { });
    }
    registerJsTask() {
        let jsEntry = this.settings.jsEntry;
        if (!fse.existsSync(jsEntry)) {
            this.tasks.task('js', () => {
                GulpLog_1.default('JS entry', chalk.cyan(jsEntry), 'was not found.', chalk.red('Aborting JS build.'));
            });
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
            return bundler.bundle()
                .on('error', PipeErrorHandler_1.default)
                .pipe(To.Vinyl('bundle.js'))
                .pipe(To.VinylBuffer())
                .pipe(this.flags.map ? sourcemaps.init({ loadMaps: true }) : through2.obj())
                .pipe(this.flags.minify ? To.Uglify() : through2.obj())
                .on('error', PipeErrorHandler_1.default)
                .pipe(this.flags.map ? sourcemaps.mapSources(this.unfuckBrowserifySourcePaths) : through2.obj())
                .pipe(this.flags.map ? sourcemaps.write('./') : through2.obj())
                .pipe(To.BuildLog('JS compilation'))
                .pipe(this.output(this.settings.outputJsFolder));
        };
        if (this.flags.watch) {
            bundler.plugin(watchify);
            bundler.on('update', compileJs);
        }
        this.tasks.task('js', compileJs);
    }
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
    registerCssTask() {
        let cssEntry = this.settings.cssEntry;
        if (!fse.existsSync(cssEntry)) {
            this.tasks.task('css', () => {
                GulpLog_1.default('CSS entry', chalk.cyan(cssEntry), 'was not found.', chalk.red('Aborting CSS build.'));
            });
            return;
        }
        this.tasks.task('css:compile', () => {
            GulpLog_1.default('Compiling CSS', chalk.cyan(cssEntry));
            let sassImports = [this.settings.npmFolder];
            return this.getCssEntryVinyl()
                .pipe(this.flags.map ? sourcemaps.init() : through2.obj())
                .pipe(To.Sass(sassImports))
                .on('error', PipeErrorHandler_1.default)
                .pipe(To.CssProcessors(this.flags.minify))
                .on('error', PipeErrorHandler_1.default)
                .pipe(this.flags.map ? sourcemaps.mapSources(this.unfuckPostCssSourcePath) : through2.obj())
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
    needPackageRestore() {
        let hasNodeModules = fse.existsSync(this.settings.npmFolder);
        let hasPackageJson = fse.existsSync(this.settings.packageJson);
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
        return __awaiter(this, void 0, void 0, function* () {
            let concat = '';
            for (let path of paths) {
                let absolute = yield this.resolveAsPromise(path);
                concat += (yield fse.readFile(absolute, 'utf8')) + '\n';
            }
            return concat;
        });
    }
    registerConcatTask() {
        let concatCount = this.settings.concatCount;
        GulpLog_1.default('Resolving', chalk.cyan(concatCount.toString()), 'concatenation targets...');
        if (concatCount === 0) {
            this.tasks.task('concat', () => { });
            return;
        }
        if (this.flags.watch) {
            GulpLog_1.default("Concatenation task will be run once and", chalk.red("NOT watched!"));
        }
        this.tasks.task('concat', () => {
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
                .on('error', PipeErrorHandler_1.default)
                .pipe(To.BuildLog('JS concatenation'))
                .pipe(this.output(this.settings.outputJsFolder));
        });
    }
}
exports.Compiler = Compiler;
