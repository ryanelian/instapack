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
import { ICompilerFlags, logAndWriteUtf8FileAsync, timedLog } from './CompilerUtilities';
import { prettyHrTime } from './PrettyUnits';
import { prettyError } from './PrettyObject';

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
    resolve(lookupStartPath: string, request: string) {
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
     * In addition to the default behavior and node_modules homing behavior, 
     * this new method looks into index file in relative folder and package.json for sass and style fields. 
     * @param lookupStartPath 
     * @param request 
     */
    async sassImport(lookupStartPath: string, request: string) {
        // https://github.com/ryanelian/instapack/issues/99

        // @import "@ryan/something"
        // E:/VS/MyProject/client/css/index.scss

        let lookupStartDir = upath.dirname(lookupStartPath);    // E:/VS/MyProject/cient/css/
        let requestFileName = upath.basename(request);          // something
        let requestDir = upath.dirname(request);                // @ryan/
        let scss = upath.extname(request) === '.scss';

        let relativeLookupDir = upath.join(lookupStartDir, requestDir); // E:/VS/MyProject/cient/css/@ryan/

        // 2: E:/VS/MyProject/client/css/@ryan/something.scss
        {
            let relativeScssFileName = upath.addExt(requestFileName, '.scss');
            let relativeScssPath = upath.resolve(relativeLookupDir, relativeScssFileName);

            if (await fse.pathExists(relativeScssPath)) {
                return relativeScssPath;
            }
        }

        // 3: E:/VS/MyProject/client/css/@ryan/_something.scss
        if (!requestFileName.startsWith('_')) {
            let partialFileName = '_' + upath.addExt(requestFileName, '.scss');
            let partialPath = upath.resolve(relativeLookupDir, partialFileName);

            if (await fse.pathExists(partialPath)) {
                return partialPath;
            }
        }

        if (!scss) {
            // 4: E:/VS/MyProject/client/css/@ryan/something.css
            {
                let relativeCssFileName = upath.addExt(requestFileName, '.css');
                let relativeCssPath = upath.resolve(relativeLookupDir, relativeCssFileName);

                if (await fse.pathExists(relativeCssPath)) {
                    return relativeCssPath;
                }
            }

            let indexDir = upath.join(lookupStartDir, request);
            // 5: E:/VS/MyProject/client/css/@ryan/something/index.scss
            {
                let indexScssPath = upath.resolve(indexDir, 'index.scss');
                if (await fse.pathExists(indexScssPath)) {
                    return indexScssPath;
                }
            }
            // 6: E:/VS/MyProject/client/css/@ryan/something/index.css
            {
                let indexCssPath = upath.resolve(indexDir, 'index.css');
                if (await fse.pathExists(indexCssPath)) {
                    return indexCssPath;
                }
            }
        }

        // 7: E:/VS/MyProject/node_modules/@ryan/something.scss
        // 7: E:/VS/MyProject/node_modules/@ryan/something.css
        // 7: E:/VS/MyProject/node_modules/@ryan/something/package.json:sass
        // 7: E:/VS/MyProject/node_modules/@ryan/something/package.json:style
        return await this.resolve(lookupStartPath, request);
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

            importer: (request, lookupStartPath, done) => {
                this.sassImport(lookupStartPath, request).then(result => {
                    // console.log(lookupStartPath, '+', request, '=', result);
                    done({
                        file: result
                    });
                }).catch(error => {
                    done(error);
                });
            }
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
            // HACK78
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
