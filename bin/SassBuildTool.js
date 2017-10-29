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
const path = require("path");
const chalk_1 = require("chalk");
const chokidar = require("chokidar");
const sass = require("node-sass");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const discardComments = require("postcss-discard-comments");
const CompilerUtilities_1 = require("./CompilerUtilities");
const PrettyUnits_1 = require("./PrettyUnits");
const PrettyObject_1 = require("./PrettyObject");
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
    fixSourceMap(sm) {
        sm.sourceRoot = 'instapack://';
        let cssProjectFolder = this.settings.inputCssFolder;
        sm.sources = sm.sources.map(s => {
            let absolute = path.join(cssProjectFolder, s);
            return CompilerUtilities_1.convertAbsoluteToSourceMapPath(this.settings.root, absolute);
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            let cssInput = this.settings.cssEntry;
            let cssOutput = this.settings.outputCssFile;
            let sassOptions = {
                file: cssInput,
                outFile: cssOutput,
                data: yield fse.readFile(cssInput, 'utf8'),
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
            let cssResult = yield postcss(plugins).process(sassResult.css, {
                from: cssOutput,
                to: cssOutput,
                map: postCssSourceMapOption
            });
            let t1 = CompilerUtilities_1.logAndWriteUtf8FileAsync(cssOutput, cssResult.css);
            if (cssResult.map) {
                let sm = cssResult.map.toJSON();
                this.fixSourceMap(sm);
                yield CompilerUtilities_1.logAndWriteUtf8FileAsync(cssOutput + '.map', JSON.stringify(sm));
            }
            yield t1;
        });
    }
    buildWithStopwatch() {
        return __awaiter(this, void 0, void 0, function* () {
            let start = process.hrtime();
            try {
                yield this.build();
            }
            catch (error) {
                console.error(PrettyObject_1.prettyError(error));
            }
            finally {
                let time = PrettyUnits_1.prettyHrTime(process.hrtime(start));
                CompilerUtilities_1.timedLog('Finished CSS build after', chalk_1.default.green(time));
            }
        });
    }
    watch() {
        chokidar.watch(this.settings.scssGlob).on('change', path => {
            this.buildWithStopwatch();
        });
    }
}
exports.SassBuildTool = SassBuildTool;
