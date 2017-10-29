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
const path = require("path");
const fse = require("fs-extra");
const resolve = require("resolve");
const os = require("os");
const Undertaker = require("undertaker");
const chalk_1 = require("chalk");
const chokidar = require("chokidar");
const sass = require("node-sass");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const discardComments = require("postcss-discard-comments");
const webpack = require("webpack");
const UglifyESOptions_1 = require("./UglifyESOptions");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const UglifyESWebpackPlugin = require("uglifyjs-webpack-plugin");
const GulpLog_1 = require("./GulpLog");
const PrettyUnits_1 = require("./PrettyUnits");
const PrettyObject_1 = require("./PrettyObject");
class Compiler {
    constructor(settings, flags) {
        this.settings = settings;
        this.flags = flags;
        this.tasks = new Undertaker();
        this.chat();
        this.registerAllTasks();
    }
    chat() {
        GulpLog_1.default('Output to folder', chalk_1.default.cyan(this.settings.outputFolder));
        if (this.flags.production) {
            GulpLog_1.default(chalk_1.default.yellow("Production"), "Mode: Outputs will be minified.", chalk_1.default.red("(Slow build)"));
        }
        else {
            GulpLog_1.default(chalk_1.default.yellow("Development"), "Mode: Outputs will", chalk_1.default.red("NOT be minified!"), "(Fast build)");
            GulpLog_1.default(chalk_1.default.red("Do not forget to minify"), "before pushing to repository or production server!");
        }
        if (this.flags.parallel) {
            GulpLog_1.default(chalk_1.default.yellow('Parallel'), 'Mode: Build will be scaled across all CPU threads!');
        }
        if (this.flags.watch) {
            GulpLog_1.default(chalk_1.default.yellow("Watch"), "Mode: Source codes will be automatically compiled on changes.");
        }
        GulpLog_1.default('Source Maps:', chalk_1.default.yellow(this.flags.sourceMap ? 'Enabled' : 'Disabled'));
    }
    registerAllTasks() {
        this.registerConcatTask();
        this.registerJsTask();
        this.registerCssTask();
        this.tasks.task('all', this.tasks.parallel('js', 'css', 'concat'));
    }
    build(taskName) {
        let run = this.tasks.task(taskName);
        run(error => { });
    }
    getParallelLoaders(cached) {
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
                uglifyOptions: UglifyESOptions_1.createUglifyESOptions()
            }));
        }
        return plugins;
    }
    get webpackConfiguration() {
        let config = {
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
                    path.resolve(__dirname, 'loaders'),
                    path.resolve(__dirname, '../node_modules'),
                    path.resolve(__dirname, '..', '..'),
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
        };
    }
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
        };
    }
    registerJsTask() {
        let jsEntry = this.settings.jsEntry;
        if (!fse.existsSync(jsEntry)) {
            this.tasks.task('js', () => {
                GulpLog_1.default('Entry file', chalk_1.default.cyan(jsEntry), 'was not found.', chalk_1.default.red('Aborting JS build.'));
            });
            return;
        }
        this.tasks.task('js', () => {
            fse.removeSync(this.settings.outputJsSourceMap);
            GulpLog_1.default('Compiling JS >', chalk_1.default.yellow(UglifyESOptions_1.tryGetTypeScriptTarget()), chalk_1.default.cyan(jsEntry));
            webpack(this.webpackConfiguration, (error, stats) => {
                if (error) {
                    GulpLog_1.default(chalk_1.default.red('FATAL ERROR'), 'during JS build:');
                    console.error(error);
                    return;
                }
                let o = stats.toJson(this.webpackStatsJsonMinimal);
                if (stats.hasErrors() || stats.hasWarnings()) {
                    console.log(stats.toString(this.webpackStatsErrorsOnly));
                }
                for (let asset of o.assets) {
                    if (asset.emitted) {
                        let kb = PrettyUnits_1.prettyBytes(asset.size);
                        GulpLog_1.default(chalk_1.default.blue(asset.name), chalk_1.default.magenta(kb));
                    }
                }
                let t = PrettyUnits_1.prettyMilliseconds(o.time);
                GulpLog_1.default('Finished JS build after', chalk_1.default.green(t));
            });
        });
    }
    compileSassAsync(options) {
        return new Promise((ok, reject) => {
            sass.render(options, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    ok(result);
                }
            });
        });
    }
    logAndWriteUtf8FileAsync(filePath, content) {
        let bundle = Buffer.from(content, 'utf8');
        let name = path.basename(filePath);
        let size = PrettyUnits_1.prettyBytes(bundle.length);
        GulpLog_1.default(chalk_1.default.blue(name), chalk_1.default.magenta(size));
        return fse.writeFile(filePath, bundle);
    }
    buildCSS() {
        return __awaiter(this, void 0, void 0, function* () {
            let cssEntry = this.settings.cssEntry;
            let outFile = path.join(path.dirname(cssEntry), this.settings.cssOut);
            let sassOptions = {
                file: cssEntry,
                outFile: outFile,
                data: yield fse.readFile(cssEntry, 'utf8'),
                includePaths: [this.settings.npmFolder],
                outputStyle: (this.flags.production ? 'compressed' : 'expanded'),
                sourceMap: this.flags.sourceMap,
                sourceMapEmbed: this.flags.sourceMap,
                sourceMapContents: this.flags.sourceMap,
            };
            let sassResult = yield this.compileSassAsync(sassOptions);
            let plugins = [autoprefixer];
            if (this.flags.production) {
                plugins.push(discardComments({
                    removeAll: true
                }));
            }
            let postCssSourceMapOption = null;
            if (this.flags.sourceMap) {
                postCssSourceMapOption = {
                    inline: false
                };
            }
            let cssOutPath = this.settings.outputCssFile;
            let cssResult = yield postcss(plugins).process(sassResult.css, {
                from: outFile,
                to: cssOutPath,
                map: postCssSourceMapOption
            });
            let t1 = this.logAndWriteUtf8FileAsync(cssOutPath, cssResult.css);
            if (cssResult.map) {
                yield this.logAndWriteUtf8FileAsync(cssOutPath + '.map', cssResult.map.toString());
            }
            yield t1;
        });
    }
    registerCssTask() {
        let cssEntry = this.settings.cssEntry;
        if (!fse.existsSync(cssEntry)) {
            this.tasks.task('css', () => {
                GulpLog_1.default('Entry file', chalk_1.default.cyan(cssEntry), 'was not found.', chalk_1.default.red('Aborting CSS build.'));
            });
            return;
        }
        this.tasks.task('css:build', () => __awaiter(this, void 0, void 0, function* () {
            let start = process.hrtime();
            try {
                yield this.buildCSS();
            }
            catch (error) {
                console.error(PrettyObject_1.prettyError(error));
            }
            finally {
                let time = PrettyUnits_1.prettyHrTime(process.hrtime(start));
                GulpLog_1.default('Finished CSS build after', chalk_1.default.green(time));
            }
        }));
        this.tasks.task('css', () => {
            fse.removeSync(this.settings.outputCssSourceMap);
            GulpLog_1.default('Compiling CSS', chalk_1.default.cyan(cssEntry));
            let run = this.tasks.task('css:build');
            run(error => {
                GulpLog_1.default(chalk_1.default.red('FATAL ERROR'), 'during CSS build:');
                console.error(error);
            });
            if (this.flags.watch) {
                chokidar.watch(this.settings.scssGlob).on('change', path => {
                    run(error => {
                        GulpLog_1.default(chalk_1.default.red('FATAL ERROR'), 'during CSS build:');
                        console.error(error);
                    });
                });
            }
        });
    }
    get needPackageRestore() {
        let hasNodeModules = fse.existsSync(this.settings.npmFolder);
        let hasPackageJson = fse.existsSync(this.settings.packageJson);
        let restore = hasPackageJson && !hasNodeModules;
        if (restore) {
            GulpLog_1.default(chalk_1.default.cyan('node_modules'), 'folder not found. Performing automatic package restore...');
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
    resolveThenConcat(paths) {
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
        let c = this.settings.concatCount;
        if (c === 0) {
            this.tasks.task('concat', () => { });
            return;
        }
        this.tasks.task('concat', () => {
            if (this.flags.watch) {
                GulpLog_1.default("Concat task will be run once and", chalk_1.default.red("NOT watched!"));
            }
            GulpLog_1.default('Resolving', chalk_1.default.cyan(c.toString()), 'concat target(s)...');
        });
    }
}
exports.Compiler = Compiler;
