"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SassBuildTool = void 0;
const fse = require("fs-extra");
const upath = require("upath");
const chalk = require("chalk");
const sass = require("sass");
const chokidar_1 = require("chokidar");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const CleanCSS = require("clean-css");
const mergeSourceMap = require("merge-source-map");
const PrettyUnits_1 = require("./PrettyUnits");
const Shout_1 = require("./Shout");
const PathFinder_1 = require("./variables-factory/PathFinder");
const SassImportResolver_1 = require("./SassImportResolver");
const VoiceAssistant_1 = require("./VoiceAssistant");
class SassBuildTool {
    constructor(variables) {
        this.variables = variables;
        this.finder = new PathFinder_1.PathFinder(variables);
        this.va = new VoiceAssistant_1.VoiceAssistant(variables.mute);
    }
    get virtualSassOutputFilePath() {
        return upath.join(this.finder.root, '(intermediate)', '(sass-output).css');
    }
    get virtualPostcssOutputFilePath() {
        return upath.join(this.finder.root, '(intermediate)', '(postcss-output).css');
    }
    fixSassGeneratedSourceMap(sm) {
        const folder = upath.basename(this.virtualSassOutputFilePath);
        sm.sources = sm.sources.map(s => {
            const absolute = upath.join(folder, s);
            return '/' + upath.relative(this.finder.root, absolute);
        });
    }
    async compileSassProject(virtualSassOutputPath) {
        const cssInput = this.finder.cssEntry;
        const sassResult = sass.renderSync({
            file: cssInput,
            outFile: virtualSassOutputPath,
            data: await fse.readFile(cssInput, 'utf8'),
            sourceMap: this.variables.sourceMap,
            sourceMapContents: this.variables.sourceMap,
            importer: (request, source) => {
                return {
                    file: SassImportResolver_1.sassImport(source, request)
                };
            },
        });
        const result = {
            css: sassResult.css.toString('utf8')
        };
        if (this.variables.sourceMap && sassResult.map) {
            const sms = sassResult.map.toString('utf8');
            const sm = JSON.parse(sms);
            this.fixSassGeneratedSourceMap(sm);
            result.map = sm;
        }
        return result;
    }
    async runPostCSS(virtualSassOutputPath, virtualPostcssOutputPath, sassResult) {
        const postcssOptions = {
            from: virtualSassOutputPath,
            to: virtualPostcssOutputPath
        };
        if (this.variables.sourceMap) {
            postcssOptions.map = {
                inline: false,
                prev: false
            };
        }
        const postcssResult = await postcss([autoprefixer])
            .process(sassResult.css, postcssOptions);
        const result = {
            css: postcssResult.css
        };
        if (this.variables.sourceMap && sassResult.map && postcssResult.map) {
            const sm2 = postcssResult.map.toJSON();
            const abs = upath.resolve(upath.dirname(virtualPostcssOutputPath), sm2.sources[0]);
            sm2.sources[0] = '/' + upath.relative(this.variables.root, abs);
            result.map = mergeSourceMap(sassResult.map, sm2);
        }
        return result;
    }
    runCleanCSS(cssOutputPath, postcssResult) {
        const cleanCssOptions = {
            level: {
                1: {
                    specialComments: false
                }
            },
            inline: false,
            sourceMap: this.variables.sourceMap,
            sourceMapInlineSources: this.variables.sourceMap
        };
        const cleanResult = new CleanCSS(cleanCssOptions).minify(postcssResult.css);
        const errors = cleanResult.errors;
        if (errors.length) {
            const errorMessage = "Error when minifying CSS:\n" + errors.map(Q => '- ' + Q.toString()).join("\n");
            throw new Error(errorMessage);
        }
        const result = {
            css: cleanResult.styles
        };
        if (this.variables.sourceMap && postcssResult.map && cleanResult.sourceMap) {
            const sm3 = cleanResult.sourceMap.toJSON();
            sm3.sources[0] = '/(intermediate)/(postcss-output).css';
            sm3.file = upath.basename(cssOutputPath);
            result.map = mergeSourceMap(postcssResult.map, sm3);
            const sourceMapFileName = upath.basename(cssOutputPath) + '.map';
            result.css += `\n/*# sourceMappingURL=${sourceMapFileName} */`;
        }
        return result;
    }
    async build() {
        const sassOutputPath = this.virtualSassOutputFilePath;
        const sassResult = await this.compileSassProject(sassOutputPath);
        const cssOutputPath = this.finder.cssOutputFilePath;
        let postcssOutputPath = cssOutputPath;
        if (this.variables.production) {
            postcssOutputPath = this.virtualPostcssOutputFilePath;
        }
        let cssResult = await this.runPostCSS(sassOutputPath, postcssOutputPath, sassResult);
        if (this.variables.production) {
            cssResult = this.runCleanCSS(cssOutputPath, cssResult);
        }
        const cssOutputTask = Shout_1.Shout.fileOutput(cssOutputPath, cssResult.css);
        if (cssResult.map) {
            cssResult.map.sourceRoot = 'instapack://';
            const s = JSON.stringify(cssResult.map);
            await Shout_1.Shout.fileOutput(cssOutputPath + '.map', s);
        }
        await cssOutputTask;
        this.va.rewind();
    }
    async buildWithStopwatch() {
        Shout_1.Shout.timed('Compiling', chalk.cyanBright('index.scss'), chalk.grey('in ' + this.finder.cssInputFolder + '/'));
        const start = process.hrtime();
        try {
            await this.build();
        }
        catch (error) {
            let render;
            this.va.speak('CSS COMPILE ERROR!');
            if (error['formatted']) {
                const formatted = 'Sass Compile' + error['formatted'].trim();
                render = chalk.redBright(formatted);
                console.error('\n' + render + '\n');
            }
            else {
                Shout_1.Shout.error('during CSS build:', error);
            }
        }
        finally {
            const time = PrettyUnits_1.prettyHrTime(process.hrtime(start));
            Shout_1.Shout.timed('Finished CSS build after', chalk.greenBright(time));
        }
    }
    watch() {
        let debounced;
        const debounce = () => {
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
