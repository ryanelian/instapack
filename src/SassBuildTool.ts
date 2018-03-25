import * as fse from 'fs-extra';
import * as upath from 'upath';
import chalk from 'chalk';
import * as chokidar from 'chokidar';
import * as sass from 'node-sass';
import * as postcss from 'postcss';
import * as autoprefixer from 'autoprefixer';
import * as discardComments from 'postcss-discard-comments';
import { RawSourceMap } from 'source-map';
import { NodeJsInputFileSystem, ResolverFactory } from 'enhanced-resolve';

import hub from './EventHub';
import { Settings } from './Settings';
import { ICompilerFlags, outputFileThenLog } from './CompilerUtilities';
import { prettyHrTime } from './PrettyUnits';
import { prettyError } from './PrettyObject';
import { Shout } from './Shout';

let resolver = ResolverFactory.createResolver({
    fileSystem: new NodeJsInputFileSystem(),
    extensions: ['.scss', '.css'],
    mainFields: ['sass', 'style']
});

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
    private readonly flags: ICompilerFlags;

    /**
     * Constructs a new instance of SassBuildTool using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(settings: Settings, flags: ICompilerFlags) {
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
            let absolute = upath.join(cssProjectFolder, s);
            return '/' + upath.relative(this.settings.root, absolute);
        });
    }

    /**
     * Resolves an Sass module import as a Promise.
     * @param lookupStartPath 
     * @param request 
     */
    resolveAsync(lookupStartPath: string, request: string) {
        return new Promise<string>((ok, reject) => {
            resolver.resolve({}, lookupStartPath, request, {}, (error: Error, result: string) => {
                if (error) {
                    reject(error);
                } else {
                    ok(result);
                }
            });
        });
    }

    /**
     * Implements a smarter Sass @import logic.
     * Performs node-like module resolution logic, which includes looking into package.json (for sass and style fields).
     * Still supports auto-relatives and (relative) _partials file resolution. 
     * @param source 
     * @param request 
     */
    async sassImport(source: string, request: string) {
        // https://github.com/ryanelian/instapack/issues/99
        // E:/VS/MyProject/client/css/index.scss @import "@ryan/something"

        let lookupStartPath = upath.dirname(source);    // E:/VS/MyProject/client/css/

        // 2: E:/VS/MyProject/client/css/@ryan/something.scss (Standard)
        // 4: E:/VS/MyProject/client/css/@ryan/something.css (Standard)
        // 5: E:/VS/MyProject/client/css/@ryan/something/index.scss (Custom)
        // 6: E:/VS/MyProject/client/css/@ryan/something/index.css (Custom)
        let isRelative = request.startsWith('./') || request.startsWith('../');
        if (!isRelative) {
            try {
                return await this.resolveAsync(lookupStartPath, './' + request);
            } catch (error) {
            }
        }

        // 3: E:/VS/MyProject/client/css/@ryan/_something.scss (Standard)
        let requestFileName = upath.basename(request);                          // something
        if (!requestFileName.startsWith('_')) {
            let requestDir = upath.dirname(request);                            // @ryan/
            let relativeLookupDir = upath.join(lookupStartPath, requestDir);    // E:/VS/MyProject/client/css/@ryan/
            let partialFileName = '_' + upath.addExt(requestFileName, '.scss');
            let partialPath = upath.resolve(relativeLookupDir, partialFileName);

            if (await fse.pathExists(partialPath)) {
                return partialPath;
            }
        }

        // 7: E:/VS/MyProject/node_modules/@ryan/something.scss (Custom)
        // 9: E:/VS/MyProject/node_modules/@ryan/something.css (Custom)
        // 10: E:/VS/MyProject/node_modules/@ryan/something/package.json (Custom)
        return await this.resolveAsync(lookupStartPath, request);

        // 8 WILL NOT WORK: E:/VS/MyProject/node_modules/@ryan/_something.scss (Custom)
        // @import against partial files in node_modules must be explicit to prevent confusion!
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

            outputStyle: (this.flags.production ? 'compressed' : 'expanded'),
            sourceMap: this.flags.sourceMap,
            sourceMapEmbed: this.flags.sourceMap,
            sourceMapContents: this.flags.sourceMap,

            importer: (request, source, done) => {
                this.sassImport(source, request).then(result => {
                    // console.log(source, '+', request, '=', result); console.log();
                    // if resulting path's .css extension is not removed, will cause CSS @import...
                    done({
                        file: upath.removeExt(result, '.css')
                    });
                }).catch(error => {
                    done(error);
                });
            }
        };

        let sassResult = await this.compileSassAsync(sassOptions);
        let cssResult = await postcss(this.postcssPlugins).process(sassResult.css, this.postcssOptions);

        let t1 = outputFileThenLog(cssOutput, cssResult.css);
        if (cssResult.map) {
            let sm = cssResult.map.toJSON();
            // HACK78
            this.fixSourceMap(sm as any);
            await outputFileThenLog(cssOutput + '.map', JSON.stringify(sm));
        }
        await t1;
    }

    /**
     * Gets the PostCSS plugins to be used.
     */
    get postcssPlugins() {
        let plugins: any[] = [autoprefixer];
        if (this.flags.production) {
            plugins.push(discardComments({
                removeAll: true
            }));
        }

        return plugins;
    }

    /**
     * Gets the appropriate PostCSS options using project settings and build flags.
     */
    get postcssOptions() {
        let cssOutput = this.settings.outputCssFile;

        let options: postcss.ProcessOptions = {
            from: cssOutput,
            to: cssOutput
        };

        if (this.flags.sourceMap) {
            options.map = {
                inline: false
            };
        }

        return options;
    }

    /**
     * Executes build method with a formatted error and stopwatch wrapper. 
     */
    async buildWithStopwatch() {
        Shout.timed('Compiling CSS', chalk.cyan(this.settings.cssEntry));
        let start = process.hrtime();
        try {
            await this.build();
        }
        catch (error) {
            console.error(prettyError(error));
        }
        finally {
            let time = prettyHrTime(process.hrtime(start));
            Shout.timed('Finished CSS build after', chalk.green(time));
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
                file = upath.toUnix(file);
                console.log(chalk.magenta('Sass') + chalk.grey(' tracking new file: ' + file));
                debounce();
            })
            .on('change', file => {
                file = upath.toUnix(file);
                console.log(chalk.magenta('Sass') + chalk.grey(' updating file: ' + file));
                debounce();
            })
            .on('unlink', file => {
                file = upath.toUnix(file);
                console.log(chalk.magenta('Sass') + chalk.grey(' removing file: ' + file));
                debounce();
            });
    }
}
