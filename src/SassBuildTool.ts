import * as fse from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import * as chokidar from 'chokidar';
import * as sass from 'node-sass';
import * as postcss from 'postcss';
import * as autoprefixer from 'autoprefixer';
import * as discardComments from 'postcss-discard-comments';
import { RawSourceMap } from 'source-map';

import hub from './EventHub';
import { Settings } from './Settings';
import { CompilerFlags, convertAbsoluteToSourceMapPath, logAndWriteUtf8FileAsync, timedLog } from './CompilerUtilities';
import { prettyHrTime } from './PrettyUnits';
import { prettyError } from './PrettyObject';

/**
 * Contains methods for compiling a Sass project.
 */
export class SassBuildTool {

    /**
     * Gets the project settings.
     */
    private readonly settings: Settings;

    /**
     * Gets the compiler build flags.
     */
    private readonly flags: CompilerFlags;

    /**
     * Constructs a new instance of SassBuildTool using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(settings: Settings, flags: CompilerFlags) {
        this.settings = settings
        this.flags = flags;
    }

    /**
     * Asynchronously compiles Sass as a Promise.
     * @param options 
     */
    compileSassAsync(options: sass.Options) {
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
     * Normalize `sources` paths of a Sass-compiled source map.
     * @param sm 
     */
    fixSourceMap(sm: RawSourceMap) {
        sm.sourceRoot = 'instapack://';

        let cssProjectFolder = this.settings.inputCssFolder;
        sm.sources = sm.sources.map(s => {
            let absolute = path.join(cssProjectFolder, s);
            return '/' + convertAbsoluteToSourceMapPath(this.settings.root, absolute);
        });
    }

    /**
     * Builds CSS project asynchronously.
     */
    async build() {
        let cssInput = this.settings.cssEntry;
        let cssOutput = this.settings.outputCssFile;

        let sassOptions: sass.Options = {
            file: cssInput,
            outFile: cssOutput,
            data: await fse.readFile(cssInput, 'utf8'),
            includePaths: [this.settings.npmFolder],

            outputStyle: (this.flags.production ? 'compressed' : 'expanded'),
            sourceMap: this.flags.sourceMap,
            sourceMapEmbed: this.flags.sourceMap,
            sourceMapContents: this.flags.sourceMap,
        };

        let sassResult = await this.compileSassAsync(sassOptions);

        let plugins: any[] = [autoprefixer];
        if (this.flags.production) {
            plugins.push(discardComments({
                removeAll: true
            }));
        }

        let postCssSourceMapOption: postcss.SourceMapOptions = null;
        if (this.flags.sourceMap) {
            postCssSourceMapOption = {
                inline: false
            };
        }

        let cssResult = await postcss(plugins).process(sassResult.css, {
            from: cssOutput,
            to: cssOutput,
            map: postCssSourceMapOption
        });

        let t1 = logAndWriteUtf8FileAsync(cssOutput, cssResult.css);
        if (cssResult.map) {
            let sm = cssResult.map.toJSON();
            // HACK: SourceMap version 0.7.1 changes RawSourceMap typing...
            this.fixSourceMap(sm as any);
            await logAndWriteUtf8FileAsync(cssOutput + '.map', JSON.stringify(sm));
        }
        await t1;
    }

    /**
     * Executes build method with a formatted error and stopwatch wrapper. 
     */
    async buildWithStopwatch() {
        timedLog('Compiling CSS', chalk.cyan(this.settings.cssEntry));
        let start = process.hrtime();
        try {
            await this.build();
        }
        catch (error) {
            console.error(prettyError(error));
        }
        finally {
            let time = prettyHrTime(process.hrtime(start));
            timedLog('Finished CSS build after', chalk.green(time));
            hub.buildDone();
        }
    }

    /**
     * Executes build when any *.scss files on the CSS project folder is modified.
     */
    watch() {
        let debounced: NodeJS.Timer;
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
                console.log(chalk.magenta('Sass') + chalk.grey(' tracking new file: ' + file));
                debounce();
            })
            .on('change', file => {
                console.log(chalk.magenta('Sass') + chalk.grey(' updating file: ' + file));
                debounce();
            })
            .on('unlink', file => {
                console.log(chalk.magenta('Sass') + chalk.grey(' removing file: ' + file));
                debounce();
            });
    }
}
