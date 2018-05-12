import * as fse from 'fs-extra';
import * as upath from 'upath';
import chalk from 'chalk';
import * as chokidar from 'chokidar';
import * as sass from 'node-sass';
import * as postcss from 'postcss';
import * as autoprefixer from 'autoprefixer';
import * as postcssImport from 'postcss-import';
let CleanCSS = require('clean-css');
import { RawSourceMap } from 'source-map';
import { NodeJsInputFileSystem, ResolverFactory } from 'enhanced-resolve';

import { Settings } from './Settings';
import { outputFileThenLog } from './CompilerUtilities';
import { prettyHrTime } from './PrettyUnits';
import { Shout } from './Shout';

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
    private readonly flags: IBuildFlags;

    /**
     * Constructs a new instance of SassBuildTool using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(settings: Settings, flags: IBuildFlags) {
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
     * Invoke enhanced-resolve custom resolver as a Promise.
     * @param lookupStartPath 
     * @param request 
     */
    resolveAsync(customResolver, lookupStartPath: string, request: string) {
        return new Promise<string>((ok, reject) => {
            customResolver.resolve({}, lookupStartPath, request, {}, (error: Error, result: string) => {
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
     * Performs node-like module resolution logic, which includes looking into package.json (for style fields).
     * Still supports auto-relatives and (relative) _partials file resolution. 
     * @param source 
     * @param request 
     */
    async sassImport(source: string, request: string): Promise<string> {
        // https://github.com/ryanelian/instapack/issues/99
        // source               :   "E:/VS/MyProject/client/css/index.scss"
        // request / @import    :   "@ryan/something"

        let lookupStartPath = upath.dirname(source);        // E:/VS/MyProject/client/css/
        let requestFileName = upath.basename(request);      // something
        let requestDir = upath.dirname(request);            // @ryan/

        let sassResolver = ResolverFactory.createResolver({
            fileSystem: new NodeJsInputFileSystem(),
            extensions: ['.scss'],
            modules: [lookupStartPath, 'node_modules'],
            mainFiles: ['index', '_index'],
            descriptionFiles: [],
            // mainFields: ['sass']
        });

        let cssResolver = ResolverFactory.createResolver({
            fileSystem: new NodeJsInputFileSystem(),
            extensions: ['.css'],
            modules: [lookupStartPath, 'node_modules'],
            mainFields: ['style']
        });

        // 3: E:/VS/MyProject/client/css/@ryan/_something.scss      (Standard)
        // 8: E:/VS/MyProject/node_modules/@ryan/_something.scss    (Standard+)
        if (!requestFileName.startsWith('_')) {
            // Add extension to file name, to prevent treating the underscored name as folder path!
            // e.g. @ryan/_something/_index.scss
            let partialFileName = '_' + upath.addExt(requestFileName, '.scss');
            let partialRequest = upath.join(requestDir, partialFileName);      // @ryan/_something.scss
            try {
                return await this.resolveAsync(sassResolver, lookupStartPath, partialRequest);
            } catch (error) {

            }
        }

        // 2: E:/VS/MyProject/client/css/@ryan/something.scss               (Standard)
        // 5: E:/VS/MyProject/client/css/@ryan/something/index.scss         (Standard https://github.com/sass/sass/issues/690) 
        // 5: E:/VS/MyProject/client/css/@ryan/something/_index.scss        (Standard https://github.com/sass/sass/issues/690)
        // 7: E:/VS/MyProject/node_modules/@ryan/something.scss             (Standard+)
        // 7: E:/VS/MyProject/node_modules/@ryan/something/index.scss       (Standard+)
        // 7: E:/VS/MyProject/node_modules/@ryan/something/_index.scss      (Standard+)
        try {
            return await this.resolveAsync(sassResolver, lookupStartPath, request);
        } catch (error) {

        }

        // 4: E:/VS/MyProject/client/css/@ryan/something.css                    (Accidental Standard https://github.com/sass/node-sass/issues/2362)
        // 6: E:/VS/MyProject/client/css/@ryan/something/index.css              (Standard+)
        // 9: E:/VS/MyProject/node_modules/@ryan/something.css                  (Standard+)
        // 9: E:/VS/MyProject/node_modules/@ryan/something/index.css            (Standard+)
        // 10: E:/VS/MyProject/node_modules/@ryan/something/package.json:style  (Custom, Node-like)
        return await this.resolveAsync(cssResolver, lookupStartPath, request);

        // Standard+: when using node-sass includePaths option set to the node_modules folder. (Older instapack behavior)
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

            sourceMap: this.flags.sourceMap,
            sourceMapEmbed: this.flags.sourceMap,
            sourceMapContents: this.flags.sourceMap,

            importer: (request, source, done) => {
                this.sassImport(source, request).then(result => {
                    // console.log(source, '+', request, '=', result); console.log();
                    done({
                        file: result
                    });
                }).catch(error => {
                    done(error);
                });
            }
        };

        let sassResult = await this.compileSassAsync(sassOptions);
        let cssResult = await postcss([
            autoprefixer(),
            postcssImport()     // will NOT auto-prefix libraries (should be authors' responsibility)
        ]).process(sassResult.css, this.postCssOptions);

        let css = cssResult.css;
        let sourceMap: RawSourceMap = undefined;
        if (this.flags.sourceMap) {
            sourceMap = cssResult.map.toJSON() as any;      // HACK78
        }

        if (this.flags.production) {
            let cleanResult = new CleanCSS(this.cleanCssOptions).minify(css, sourceMap);

            let errors: Error[] = cleanResult.errors;
            if (errors.length) {
                let errorMessage = "Error when minifying CSS:\n" + errors.map(Q => Q.stack).join("\n\n");
                throw new Error(errorMessage);
            }

            css = cleanResult.styles;

            if (this.flags.sourceMap) {
                let sourceMapFileName = upath.basename(cssOutput) + '.map';
                css += '\n' + `/*# sourceMappingURL=${sourceMapFileName} */`;
                sourceMap = cleanResult.sourceMap.toJSON();
            }
        }

        let t1 = outputFileThenLog(cssOutput, css);
        if (this.flags.sourceMap) {
            this.fixSourceMap(sourceMap as any);        // HACK78
            await outputFileThenLog(cssOutput + '.map', JSON.stringify(sourceMap));
        }
        await t1;
    }

    /**
     * Gets the Clean CSS options using project build flags.
     */
    get cleanCssOptions() {
        return {
            level: {
                1: {
                    specialComments: false
                }
            },
            sourceMap: this.flags.sourceMap,
            sourceMapInlineSources: this.flags.sourceMap
        };
    }

    /**
     * Gets the PostCSS options using project settings and build flags.
     */
    get postCssOptions() {
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
        Shout.timed('Compiling', chalk.cyan('index.scss'), chalk.grey('in ' + this.settings.inputCssFolder + '/'));
        let start = process.hrtime();
        try {
            await this.build();
        }
        catch (error) {
            let render: string;
            Shout.notify('You have one or more CSS build errors!');

            if (error['formatted']) {
                // for node-sass compile error
                let formatted = 'Sass Compile' + (error['formatted'] as string).trim();
                render = chalk.red(formatted);
                console.error('\n' + render + '\n');
            } else {
                Shout.error('during CSS build:', error);
            }
        }
        finally {
            let time = prettyHrTime(process.hrtime(start));
            Shout.timed('Finished CSS build after', chalk.green(time));
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
                Shout.sass(chalk.grey('tracking new file:', file));
                debounce();
            })
            .on('change', file => {
                file = upath.toUnix(file);
                Shout.sass(chalk.grey('updating file:', file));
                debounce();
            })
            .on('unlink', file => {
                file = upath.toUnix(file);
                Shout.sass(chalk.grey('removing file:', file));
                debounce();
            });
    }
}
