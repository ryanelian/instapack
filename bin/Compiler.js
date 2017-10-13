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
const webpack = require("webpack");
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
class Compiler {
    constructor(settings, flags) {
        this.settings = settings;
        this.flags = flags;
        this.tasks = new Undertaker();
        this.chat();
        this.registerAllTasks();
    }
    chat() {
        GulpLog_1.default('Using output folder', chalk.cyan(this.settings.outputFolder));
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
            if (file.isStream()) {
                let error = new Error('instapack output: Streaming is not supported!');
                return next(error);
            }
            if (file.isBuffer()) {
                let p = path.join(folder, file.relative);
                yield fse.outputFile(p, file.contents);
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
        let config = {
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
    registerJsTask() {
        let jsEntry = this.settings.jsEntry;
        if (!fse.existsSync(jsEntry)) {
            this.tasks.task('js', () => {
                GulpLog_1.default('JS entry', chalk.cyan(jsEntry), 'was not found.', chalk.red('Aborting JS build.'));
            });
            return;
        }
        this.tasks.task('js', () => {
            GulpLog_1.default('Compiling JS', chalk.cyan(jsEntry));
            let config = this.createWebpackConfig();
            webpack(config, (error, stats) => {
                if (error) {
                    console.error(error);
                }
                GulpLog_1.default('Finished JS compilation:');
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
                .pipe(To.CssProcessors())
                .on('error', PipeErrorHandler_1.default)
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
    get needPackageRestore() {
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
                let ar = resolution[target];
                if (!ar || ar.length === 0) {
                    GulpLog_1.default(chalk.red('WARNING'), 'concat modules definition for', chalk.blue(target), 'is empty!');
                    concatCount--;
                    if (concatCount === 0) {
                        g.push(null);
                    }
                    continue;
                }
                if (typeof ar === 'string') {
                    ar = [ar];
                    GulpLog_1.default(chalk.red('WARNING'), 'concat modules definition for', chalk.blue(target), 'is a', chalk.yellow('string'), 'instead of a', chalk.yellow('string[]'));
                }
                this.resolveThenConcatenate(ar).then(result => {
                    g.push(new vinyl({
                        path: target + '.js',
                        contents: Buffer.from(result)
                    }));
                }).catch(error => {
                    GulpLog_1.default(chalk.red('ERROR'), 'when concatenating', chalk.blue(target));
                    console.log(error);
                }).then(() => {
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
