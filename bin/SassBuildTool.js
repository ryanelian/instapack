"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fse = require("fs-extra");
const upath = require("upath");
const chalk = require("chalk");
const sass = require("sass");
const chokidar_1 = require("chokidar");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const CleanCSS = require('clean-css');
const mergeSourceMap = require("merge-source-map");
const Fiber = require("fibers");
const PrettyUnits_1 = require("./PrettyUnits");
const Shout_1 = require("./Shout");
const PathFinder_1 = require("./variables-factory/PathFinder");
const SassImportResolver_1 = require("./SassImportResolver");
const VoiceAssistant_1 = require("./VoiceAssistant");
class SassBuildTool {
    constructor(variables) {
        this.variables = variables;
        this.finder = new PathFinder_1.PathFinder(variables);
        this.va = new VoiceAssistant_1.VoiceAssistant(variables.silent);
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
        return upath.join(this.finder.root, '(intermediate)', '(sass-output).css');
    }
    get virtualPostcssOutputFilePath() {
        return upath.join(this.finder.root, '(intermediate)', '(postcss-output).css');
    }
    fixSassGeneratedSourceMap(sm) {
        let folder = upath.basename(this.virtualSassOutputFilePath);
        sm.sources = sm.sources.map(s => {
            let absolute = upath.join(folder, s);
            return '/' + upath.relative(this.finder.root, absolute);
        });
    }
    compileSassProject(virtualSassOutputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let cssInput = this.finder.cssEntry;
            let sassOptions = {
                file: cssInput,
                outFile: virtualSassOutputPath,
                data: yield fse.readFile(cssInput, 'utf8'),
                sourceMap: this.variables.sourceMap,
                sourceMapContents: this.variables.sourceMap,
                importer: SassImportResolver_1.sassImporter
            };
            sassOptions['fiber'] = Fiber;
            let sassResult = yield this.runSassAsync(sassOptions);
            let result = {
                css: sassResult.css.toString('utf8')
            };
            if (this.variables.sourceMap && sassResult.map) {
                let sms = sassResult.map.toString('utf8');
                let sm = JSON.parse(sms);
                this.fixSassGeneratedSourceMap(sm);
                result.map = sm;
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
            if (this.variables.sourceMap) {
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
            if (this.variables.sourceMap && sassResult.map && postcssResult.map) {
                let sm2 = postcssResult.map.toJSON();
                let abs = upath.resolve(upath.dirname(virtualPostcssOutputPath), sm2.sources[0]);
                sm2.sources[0] = '/' + upath.relative(this.variables.root, abs);
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
            inline: false,
            sourceMap: this.variables.sourceMap,
            sourceMapInlineSources: this.variables.sourceMap
        };
        let cleanResult = new CleanCSS(cleanCssOptions).minify(postcssResult.css);
        let errors = cleanResult.errors;
        if (errors.length) {
            let errorMessage = "Error when minifying CSS:\n" + errors.map(Q => '- ' + Q.toString()).join("\n");
            throw new Error(errorMessage);
        }
        let result = {
            css: cleanResult.styles
        };
        if (this.variables.sourceMap && postcssResult.map && cleanResult.sourceMap) {
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
            let cssOutputPath = this.finder.cssOutputFilePath;
            let postcssOutputPath = cssOutputPath;
            if (this.variables.production) {
                postcssOutputPath = this.virtualPostcssOutputFilePath;
            }
            let cssResult = yield this.runPostCSS(sassOutputPath, postcssOutputPath, sassResult);
            if (this.variables.production) {
                cssResult = this.runCleanCSS(cssOutputPath, cssResult);
            }
            let cssOutputTask = Shout_1.Shout.fileOutput(cssOutputPath, cssResult.css);
            if (cssResult.map) {
                cssResult.map.sourceRoot = 'instapack://';
                let s = JSON.stringify(cssResult.map);
                yield Shout_1.Shout.fileOutput(cssOutputPath + '.map', s);
            }
            yield cssOutputTask;
            this.va.rewind();
        });
    }
    buildWithStopwatch() {
        return __awaiter(this, void 0, void 0, function* () {
            Shout_1.Shout.timed('Compiling', chalk.cyan('index.scss'), chalk.grey('in ' + this.finder.cssInputFolder + '/'));
            let start = process.hrtime();
            try {
                yield this.build();
            }
            catch (error) {
                let render;
                this.va.speak('CSS COMPILE ERROR!');
                if (error['formatted']) {
                    let formatted = 'Sass Compile' + error['formatted'].trim();
                    render = chalk.red(formatted);
                    console.error('\n' + render + '\n');
                }
                else {
                    Shout_1.Shout.error('during CSS build:', error);
                }
            }
            finally {
                let time = PrettyUnits_1.prettyHrTime(process.hrtime(start));
                Shout_1.Shout.timed('Finished CSS build after', chalk.green(time));
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
        chokidar_1.watch(this.finder.scssGlob, {
            ignoreInitial: true
        })
            .on('add', file => {
            Shout_1.Shout.sass(chalk.grey('tracking new file:', file));
            debounce();
        })
            .on('change', file => {
            Shout_1.Shout.sass(chalk.grey('updating file:', file));
            debounce();
        })
            .on('unlink', file => {
            Shout_1.Shout.sass(chalk.grey('removing file:', file));
            debounce();
        });
    }
}
exports.SassBuildTool = SassBuildTool;
