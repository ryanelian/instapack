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
const sass = require("sass");
const chokidar = require("chokidar");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const CleanCSS = require('clean-css');
const mergeSourceMap = require("merge-source-map");
const enhanced_resolve_1 = require("enhanced-resolve");
const CompilerUtilities_1 = require("./CompilerUtilities");
const PrettyUnits_1 = require("./PrettyUnits");
const Shout_1 = require("./Shout");
class SassBuildTool {
    constructor(settings, flags) {
        this.settings = settings;
        this.flags = flags;
    }
    runSassAsync(options) {
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
    get virtualSassOutputFilePath() {
        return upath.join(this.settings.root, '(intermediate)', '(sass-output).css');
    }
    get virtualPostcssOutputFilePath() {
        return upath.join(this.settings.root, '(intermediate)', '(postcss-output).css');
    }
    fixSassGeneratedSourceMap(sm) {
        let folder = upath.basename(this.virtualSassOutputFilePath);
        sm.sources = sm.sources.map(s => {
            let absolute = upath.join(folder, s);
            return '/' + upath.relative(this.settings.root, absolute);
        });
    }
    resolveAsync(customResolver, lookupStartPath, request) {
        return new Promise((ok, reject) => {
            customResolver.resolve({}, lookupStartPath, request, {}, (error, resolution) => {
                if (error) {
                    reject(error);
                }
                else {
                    ok(resolution);
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
    compileSassProject(virtualSassOutputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let cssInput = this.settings.cssEntry;
            let sassOptions = {
                file: cssInput,
                outFile: virtualSassOutputPath,
                data: yield fse.readFile(cssInput, 'utf8'),
                sourceMap: this.flags.sourceMap,
                sourceMapContents: this.flags.sourceMap,
                importer: (request, source, done) => {
                    this.sassImport(source, request).then(resolution => {
                        done({
                            file: resolution
                        });
                    }).catch(error => {
                        done(error);
                    });
                }
            };
            let sassResult = yield this.runSassAsync(sassOptions);
            let css = sassResult.css.toString('utf8');
            let charsetHeader = '@charset "UTF-8";\n';
            if (css.startsWith(charsetHeader)) {
                css = css.substring(charsetHeader.length);
            }
            let result = {
                css: css
            };
            if (this.flags.sourceMap && sassResult.map) {
                let sms = sassResult.map.toString('utf8');
                let sm1 = JSON.parse(sms);
                this.fixSassGeneratedSourceMap(sm1);
                result.map = sm1;
            }
            return result;
        });
    }
    runPostCSS(virtualSassOutputPath, virtualPostcssOutputPath, sassResult) {
        return __awaiter(this, void 0, void 0, function* () {
            let postcssOptions = {
                from: virtualSassOutputPath,
                to: virtualPostcssOutputPath
            };
            if (this.flags.sourceMap) {
                postcssOptions.map = {
                    inline: false,
                    prev: false
                };
            }
            let postcssResult = yield postcss([
                autoprefixer()
            ]).process(sassResult.css, postcssOptions);
            let result = {
                css: postcssResult.css
            };
            if (this.flags.sourceMap && sassResult.map && postcssResult.map) {
                let sm2 = postcssResult.map.toJSON();
                let abs = upath.resolve(upath.dirname(virtualPostcssOutputPath), sm2.sources[0]);
                sm2.sources[0] = '/' + upath.relative(this.settings.root, abs);
                result.map = mergeSourceMap(sassResult.map, sm2);
            }
            return result;
        });
    }
    runCleanCSS(cssOutputPath, postcssResult) {
        let cleanCssOptions = {
            level: {
                1: {
                    specialComments: false
                }
            },
            sourceMap: this.flags.sourceMap,
            sourceMapInlineSources: this.flags.sourceMap
        };
        let cleanResult = new CleanCSS(cleanCssOptions).minify(postcssResult.css);
        let errors = cleanResult.errors;
        if (errors.length) {
            let errorMessage = "Error when minifying CSS:\n" + errors.map(Q => Q.stack).join("\n\n");
            throw new Error(errorMessage);
        }
        let result = {
            css: cleanResult.styles
        };
        if (this.flags.sourceMap && postcssResult.map && cleanResult.sourceMap) {
            let sm3 = cleanResult.sourceMap.toJSON();
            sm3.sources[0] = '/(intermediate)/(postcss-output).css';
            sm3.file = upath.basename(cssOutputPath);
            result.map = mergeSourceMap(postcssResult.map, sm3);
            let sourceMapFileName = upath.basename(cssOutputPath) + '.map';
            result.css += `\n/*# sourceMappingURL=${sourceMapFileName} */`;
        }
        return result;
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            let sassOutputPath = this.virtualSassOutputFilePath;
            let sassResult = yield this.compileSassProject(sassOutputPath);
            let cssOutputPath = this.settings.outputCssFile;
            let postcssOutputPath = cssOutputPath;
            if (this.flags.production) {
                postcssOutputPath = this.virtualPostcssOutputFilePath;
            }
            let cssResult = yield this.runPostCSS(sassOutputPath, postcssOutputPath, sassResult);
            if (this.flags.production) {
                cssResult = this.runCleanCSS(cssOutputPath, cssResult);
            }
            let cssOutputTask = CompilerUtilities_1.outputFileThenLog(cssOutputPath, cssResult.css);
            if (cssResult.map) {
                cssResult.map.sourceRoot = 'instapack://';
                let s = JSON.stringify(cssResult.map);
                yield CompilerUtilities_1.outputFileThenLog(cssOutputPath + '.map', s);
            }
            yield cssOutputTask;
        });
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
