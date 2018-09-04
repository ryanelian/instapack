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
const fse = require("fs-extra");
const upath = require("upath");
const chalk_1 = require("chalk");
const chokidar = require("chokidar");
const sass = require("node-sass");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const postcssImport = require("postcss-import");
const cssnano = require("cssnano");
const enhanced_resolve_1 = require("enhanced-resolve");
const CompilerUtilities_1 = require("./CompilerUtilities");
const PrettyUnits_1 = require("./PrettyUnits");
const Shout_1 = require("./Shout");
class SassBuildTool {
    constructor(settings, flags) {
        this.settings = settings;
        this.flags = flags;
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
    get virtualSassCompiledCssFolderPath() {
        return upath.join(this.settings.root, '(sass)');
    }
    get virtualSassCompiledCssFilePath() {
        return upath.join(this.virtualSassCompiledCssFolderPath, '(compiled).css');
    }
    fixSourceMap(sm) {
        sm.sourceRoot = 'instapack://';
        let cssProjectFolder = this.settings.outputCssFolder;
        sm.sources = sm.sources.map(s => {
            let absolute = upath.join(cssProjectFolder, s);
            return '/' + upath.relative(this.settings.root, absolute);
        });
    }
    resolveAsync(customResolver, lookupStartPath, request) {
        return new Promise((ok, reject) => {
            customResolver.resolve({}, lookupStartPath, request, {}, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    ok(result);
                }
            });
        });
    }
    sassImport(source, request) {
        return __awaiter(this, void 0, void 0, function* () {
            let lookupStartPath = upath.dirname(source);
            let requestFileName = upath.basename(request);
            let requestDir = upath.dirname(request);
            if (requestFileName.startsWith('_') === false) {
                let partialFileName = '_' + upath.addExt(requestFileName, '.scss');
                let partialRequest = upath.join(requestDir, partialFileName);
                let relativePartialPath = upath.join(lookupStartPath, partialRequest);
                if (yield fse.pathExists(relativePartialPath)) {
                    return relativePartialPath;
                }
                let packagePartialPath = upath.join(this.settings.npmFolder, partialRequest);
                if (yield fse.pathExists(packagePartialPath)) {
                    return packagePartialPath;
                }
            }
            let sassResolver = enhanced_resolve_1.ResolverFactory.createResolver({
                fileSystem: new enhanced_resolve_1.NodeJsInputFileSystem(),
                extensions: ['.scss'],
                modules: [lookupStartPath, 'node_modules'],
                mainFiles: ['index', '_index'],
                descriptionFiles: [],
            });
            try {
                return yield this.resolveAsync(sassResolver, lookupStartPath, request);
            }
            catch (error) {
            }
            let cssResolver = enhanced_resolve_1.ResolverFactory.createResolver({
                fileSystem: new enhanced_resolve_1.NodeJsInputFileSystem(),
                extensions: ['.css'],
                modules: [lookupStartPath, 'node_modules'],
                mainFields: ['style']
            });
            return yield this.resolveAsync(cssResolver, lookupStartPath, request);
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            let cssInput = this.settings.cssEntry;
            let virtualCssOutput = this.virtualSassCompiledCssFilePath;
            let cssOutput = this.settings.outputCssFile;
            let sassOptions = {
                file: cssInput,
                outFile: virtualCssOutput,
                data: yield fse.readFile(cssInput, 'utf8'),
                outputStyle: 'compressed',
                sourceMap: this.flags.sourceMap,
                sourceMapContents: this.flags.sourceMap,
                importer: (request, source, done) => {
                    this.sassImport(source, request).then(result => {
                        done({
                            file: result
                        });
                    }).catch(error => {
                        done(error);
                    });
                }
            };
            let sassResult = yield this.compileSassAsync(sassOptions);
            let postcssOptions = {
                from: virtualCssOutput,
                to: cssOutput
            };
            if (this.flags.sourceMap && sassResult.map) {
                let sassMapString = sassResult.map.toString('utf8');
                let sassMap = JSON.parse(sassMapString);
                postcssOptions.map = {
                    inline: false,
                    prev: sassMap
                };
            }
            let cssResult = yield postcss(this.postcssPlugins).process(sassResult.css, postcssOptions);
            let cssOutputTask = CompilerUtilities_1.outputFileThenLog(cssOutput, cssResult.css);
            if (this.flags.sourceMap && cssResult.map) {
                let sourceMapLegacyType = cssResult.map.toJSON();
                let sourceMap = sourceMapLegacyType;
                this.fixSourceMap(sourceMap);
                yield CompilerUtilities_1.outputFileThenLog(cssOutput + '.map', JSON.stringify(sourceMap));
            }
            yield cssOutputTask;
        });
    }
    get postcssPlugins() {
        let postcssPlugins = [
            autoprefixer(),
            postcssImport()
        ];
        if (this.flags.production) {
            postcssPlugins.push(cssnano({
                preset: ['default', {
                        cssDeclarationSorter: false,
                        discardComments: {
                            removeAll: true,
                        }
                    }]
            }));
        }
        return postcssPlugins;
    }
    buildWithStopwatch() {
        return __awaiter(this, void 0, void 0, function* () {
            Shout_1.Shout.timed('Compiling', chalk_1.default.cyan('index.scss'), chalk_1.default.grey('in ' + this.settings.inputCssFolder + '/'));
            let start = process.hrtime();
            try {
                yield this.build();
            }
            catch (error) {
                let render;
                Shout_1.Shout.notify('You have one or more CSS build errors!');
                if (error['formatted']) {
                    let formatted = 'Sass Compile' + error['formatted'].trim();
                    render = chalk_1.default.red(formatted);
                    console.error('\n' + render + '\n');
                }
                else {
                    Shout_1.Shout.error('during CSS build:', error);
                }
            }
            finally {
                let time = PrettyUnits_1.prettyHrTime(process.hrtime(start));
                Shout_1.Shout.timed('Finished CSS build after', chalk_1.default.green(time));
            }
        });
    }
    watch() {
        let debounced;
        let debounce = () => {
            clearTimeout(debounced);
            debounced = setTimeout(() => {
                this.buildWithStopwatch();
            }, 300);
        };
        chokidar.watch(this.settings.scssGlob, {
            ignoreInitial: true
        })
            .on('add', file => {
            file = upath.toUnix(file);
            Shout_1.Shout.sass(chalk_1.default.grey('tracking new file:', file));
            debounce();
        })
            .on('change', file => {
            file = upath.toUnix(file);
            Shout_1.Shout.sass(chalk_1.default.grey('updating file:', file));
            debounce();
        })
            .on('unlink', file => {
            file = upath.toUnix(file);
            Shout_1.Shout.sass(chalk_1.default.grey('removing file:', file));
            debounce();
        });
    }
}
exports.SassBuildTool = SassBuildTool;
