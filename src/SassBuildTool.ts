import * as fse from 'fs-extra';
import * as upath from 'upath';
import chalk = require('chalk');
import sass = require('sass');
import { watch } from 'chokidar';
import postcss = require('postcss');
import autoprefixer = require('autoprefixer');
import CleanCSS = require('clean-css');
import { RawSourceMap } from 'source-map';
import mergeSourceMap = require('merge-source-map');
import Fiber = require("fibers");

import { prettyHrTime } from './PrettyUnits';
import { Shout } from './Shout';
import { BuildVariables } from './variables-factory/BuildVariables';
import { PathFinder } from './variables-factory/PathFinder';
import { sassImporter } from './SassImportResolver';
import { VoiceAssistant } from './VoiceAssistant';

/**
 * Contains items returned by a CSS build sub-process.
 */
interface CssBuildResult {
    css: string;
    map?: RawSourceMap;
}

/**
 * Contains methods for compiling a Sass project.
 */
export class SassBuildTool {

    private variables: BuildVariables;
    private finder: PathFinder;
    private va: VoiceAssistant;

    /**
     * Constructs a new instance of SassBuildTool using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(variables: BuildVariables) {
        this.variables = variables;
        this.finder = new PathFinder(variables);
        this.va = new VoiceAssistant(variables.silent);
    }

    /**
     * Asynchronously run Sass as a Promise.
     * @param options 
     */
    runSassAsync(options: sass.Options): Promise<sass.Result> {
        return new Promise<sass.Result>((ok, reject) => {
            sass.render(options, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    ok(result);
                }
            });
        });
    }

    /**
     * Gets the full file path of the virtual Sass-Compiled CSS file. 
     */
    get virtualSassOutputFilePath(): string {
        return upath.join(this.finder.root, '(intermediate)', '(sass-output).css');
    }

    /**
     * Gets the full file path of the virtual Sass-Compiled CSS file. 
     */
    get virtualPostcssOutputFilePath(): string {
        return upath.join(this.finder.root, '(intermediate)', '(postcss-output).css');
    }

    /**
     * Normalize `sources` paths of a Sass-compiled source map.
     * @param sm 
     */
    fixSassGeneratedSourceMap(sm: RawSourceMap): void {
        const folder = upath.basename(this.virtualSassOutputFilePath);
        sm.sources = sm.sources.map(s => {
            const absolute = upath.join(folder, s);
            return '/' + upath.relative(this.finder.root, absolute);
        });
    }

    /**
     * Compile the Sass project using project settings against the entry point.
     * Normalize generated source map.
     * @param virtualSassOutputPath 
     */
    async compileSassProject(virtualSassOutputPath: string): Promise<CssBuildResult> {
        const cssInput = this.finder.cssEntry;

        let sassOptions: sass.Options = {
            file: cssInput,
            outFile: virtualSassOutputPath,
            data: await fse.readFile(cssInput, 'utf8'),

            sourceMap: this.variables.sourceMap,
            sourceMapContents: this.variables.sourceMap,
            importer: sassImporter,
        };

        // enable calling asynchronous importers from the synchronous code path
        sassOptions = Object.assign(sassOptions, {
            'fiber': Fiber
        });

        const sassResult = await this.runSassAsync(sassOptions);

        const result: CssBuildResult = {
            css: sassResult.css.toString('utf8')
        };

        if (this.variables.sourceMap && sassResult.map) {
            const sms: string = sassResult.map.toString('utf8');
            const sm: RawSourceMap = JSON.parse(sms);
            this.fixSassGeneratedSourceMap(sm);

            // console.log(sm.sources);
            // console.log(sm.file);

            result.map = sm;
        }

        return result;
    }

    /**
     * Run PostCSS against previous build (Sass) result targeting the output path 
     * (virtual if development, real if production).
     * Merge and normalize the source map. 
     * @param virtualSassOutputPath 
     * @param virtualPostcssOutputPath 
     * @param sassResult 
     */
    async runPostCSS(virtualSassOutputPath: string, virtualPostcssOutputPath: string, sassResult: CssBuildResult): Promise<CssBuildResult> {
        const postcssOptions: postcss.ProcessOptions = {
            from: virtualSassOutputPath,
            to: virtualPostcssOutputPath
        };

        if (this.variables.sourceMap) {
            postcssOptions.map = {
                inline: false,
                prev: false
            };
        }

        const postcssResult = await postcss([
            autoprefixer()
        ]).process(sassResult.css, postcssOptions);

        const result: CssBuildResult = {
            css: postcssResult.css
        };

        if (this.variables.sourceMap && sassResult.map && postcssResult.map) {
            const sm2 = postcssResult.map.toJSON();
            const abs = upath.resolve(upath.dirname(virtualPostcssOutputPath), sm2.sources[0]);
            // console.log(abs);

            sm2.sources[0] = '/' + upath.relative(this.variables.root, abs);
            // console.log(sm2.sources);
            // console.log(sm2.file);

            result.map = mergeSourceMap(sassResult.map, sm2);
            /*
            => Found "merge-source-map@1.1.0"
            info Reasons this module exists
            - Hoisted from "vue-loader#@vue#component-compiler-utils#merge-source-map"
            */
        }

        return result;
    }

    /**
     * Run CleanCSS against previous build (PostCSS) result targeting the physical output path.
     * Merge and normalize the source map. 
     * @param cssOutputPath 
     * @param postcssResult 
     */
    runCleanCSS(cssOutputPath: string, postcssResult: CssBuildResult): CssBuildResult {
        const cleanCssOptions = {
            level: {
                1: {
                    specialComments: false
                }
            },
            inline: false, // let Sass handle @import
            sourceMap: this.variables.sourceMap,
            sourceMapInlineSources: this.variables.sourceMap
        };

        const cleanResult = new CleanCSS(cleanCssOptions).minify(postcssResult.css);
        const errors: Error[] = cleanResult.errors;
        if (errors.length) {
            const errorMessage = "Error when minifying CSS:\n" + errors.map(Q => '- ' + Q.toString()).join("\n");
            throw new Error(errorMessage);
        }

        const result: CssBuildResult = {
            css: cleanResult.styles
        };

        if (this.variables.sourceMap && postcssResult.map && cleanResult.sourceMap) {
            const sm3: RawSourceMap = cleanResult.sourceMap.toJSON();
            sm3.sources[0] = '/(intermediate)/(postcss-output).css';
            sm3.file = upath.basename(cssOutputPath);

            // console.log(sm3.sources);
            // console.log(sm3.file);

            result.map = mergeSourceMap(postcssResult.map, sm3);
            // console.log(result.map.sources);
            // console.log(result.map.file);

            const sourceMapFileName = upath.basename(cssOutputPath) + '.map';
            result.css += `\n/*# sourceMappingURL=${sourceMapFileName} */`;
        }

        return result;
    }

    /**
     * Builds the CSS project asynchronously.
     */
    async build(): Promise<void> {
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

        const cssOutputTask = Shout.fileOutput(cssOutputPath, cssResult.css);

        if (cssResult.map) {
            cssResult.map.sourceRoot = 'instapack://';
            const s = JSON.stringify(cssResult.map);
            await Shout.fileOutput(cssOutputPath + '.map', s);
        }

        await cssOutputTask;
        this.va.rewind();
    }

    /**
     * Executes build method with a formatted error and stopwatch wrapper. 
     */
    async buildWithStopwatch(): Promise<void> {
        Shout.timed('Compiling', chalk.cyan('index.scss'), chalk.grey('in ' + this.finder.cssInputFolder + '/'));
        const start = process.hrtime();
        try {
            await this.build();
        }
        catch (error) {
            let render: string;
            this.va.speak('CSS COMPILE ERROR!');

            if (error['formatted']) {
                // for node-sass compile error
                const formatted = 'Sass Compile' + (error['formatted'] as string).trim();
                render = chalk.red(formatted);
                console.error('\n' + render + '\n');
            } else {
                Shout.error('during CSS build:', error);
            }
        }
        finally {
            const time = prettyHrTime(process.hrtime(start));
            Shout.timed('Finished CSS build after', chalk.green(time));
        }
    }

    /**
     * Executes build when any *.scss files on the CSS project folder is modified.
     */
    watch(): void {
        let debounced: NodeJS.Timer;
        const debounce = (): void => {
            clearTimeout(debounced);
            debounced = setTimeout(() => {
                this.buildWithStopwatch();
            }, 300);
        };

        watch(this.finder.scssGlob, {
            ignoreInitial: true
        })
            .on('add', file => {
                Shout.sass(chalk.grey('tracking new file:', file));
                debounce();
            })
            .on('change', file => {
                Shout.sass(chalk.grey('updating file:', file));
                debounce();
            })
            .on('unlink', file => {
                Shout.sass(chalk.grey('removing file:', file));
                debounce();
            });
    }
}
