import * as fse from 'fs-extra';
import * as upath from 'upath';
import chalk from 'chalk';
import * as sass from 'sass';
import * as chokidar from 'chokidar';
import * as postcss from 'postcss';
import * as autoprefixer from 'autoprefixer';
const CleanCSS = require('clean-css');
import { RawSourceMap } from 'source-map';
import * as mergeSourceMap from 'merge-source-map';
import { NodeJsInputFileSystem, ResolverFactory } from 'enhanced-resolve';

import { Settings } from './Settings';
import { outputFileThenLog } from './CompilerUtilities';
import { prettyHrTime } from './PrettyUnits';
import { Shout } from './Shout';

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
     * Asynchronously run Sass as a Promise.
     * @param options 
     */
    runSassAsync(options: sass.Options) {
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
    get virtualSassOutputFilePath() {
        return upath.join(this.settings.root, '(intermediate)', '(sass-output).css');
    }

    /**
     * Gets the full file path of the virtual Sass-Compiled CSS file. 
     */
    get virtualPostcssOutputFilePath() {
        return upath.join(this.settings.root, '(intermediate)', '(postcss-output).css');
    }

    /**
     * Normalize `sources` paths of a Sass-compiled source map.
     * @param sm 
     */
    fixSassGeneratedSourceMap(sm: RawSourceMap) {
        let folder = upath.basename(this.virtualSassOutputFilePath);
        sm.sources = sm.sources.map(s => {
            let absolute = upath.join(folder, s);
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
            customResolver.resolve({}, lookupStartPath, request, {}, (error: Error, resolution: string) => {
                if (error) {
                    reject(error);
                } else {
                    ok(resolution);
                }
            });
        });
    }

    /**
     * Implements a smarter Sass @import logic.
     * Performs node-like module resolution logic, which includes looking into package.json for style field.
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

        if (requestFileName.startsWith('_') === false) {
            let partialFileName = '_' + upath.addExt(requestFileName, '.scss');
            let partialRequest = upath.join(requestDir, partialFileName);      // @ryan/_something.scss

            // 3: E:/VS/MyProject/client/css/@ryan/_something.scss      (Standard)
            let relativePartialPath = upath.join(lookupStartPath, partialRequest);
            if (await fse.pathExists(relativePartialPath)) {
                return relativePartialPath;
            }

            // 8: E:/VS/MyProject/node_modules/@ryan/_something.scss    (Standard+)
            let packagePartialPath = upath.join(this.settings.npmFolder, partialRequest);
            if (await fse.pathExists(packagePartialPath)) {
                return packagePartialPath;
            }
        }

        let sassResolver = ResolverFactory.createResolver({
            fileSystem: new NodeJsInputFileSystem(),
            extensions: ['.scss'],
            modules: [lookupStartPath, 'node_modules'],
            mainFiles: ['index', '_index'],
            descriptionFiles: [],
            // mainFields: ['sass']
        });

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

        let cssResolver = ResolverFactory.createResolver({
            fileSystem: new NodeJsInputFileSystem(),
            extensions: ['.css'],
            modules: [lookupStartPath, 'node_modules'],
            mainFields: ['style']
        });

        // http://sass.logdown.com/posts/7807041-feature-watchcss-imports-and-css-compatibility
        // 4: E:/VS/MyProject/client/css/@ryan/something.css                    (Standard)
        // 6: E:/VS/MyProject/client/css/@ryan/something/index.css              (Standard)
        // 9: E:/VS/MyProject/node_modules/@ryan/something.css                  (Standard+)
        // 9: E:/VS/MyProject/node_modules/@ryan/something/index.css            (Standard+)
        // 10: E:/VS/MyProject/node_modules/@ryan/something/package.json:style  (Custom, Node-like)
        return await this.resolveAsync(cssResolver, lookupStartPath, request);

        // Standard+: when using node-sass includePaths option set to the node_modules folder. (Older instapack behavior)
    }

    /**
     * Compile the Sass project using project settings against the entry point.
     * Normalize generated source map.
     * @param virtualSassOutputPath 
     */
    async compileSassProject(virtualSassOutputPath: string) {
        let cssInput = this.settings.cssEntry;

        let sassOptions: sass.Options = {
            file: cssInput,
            outFile: virtualSassOutputPath,
            data: await fse.readFile(cssInput, 'utf8'),

            sourceMap: this.flags.sourceMap,
            sourceMapContents: this.flags.sourceMap,

            importer: (request, source, done) => {
                this.sassImport(source, request).then(resolution => {
                    // console.log(source, '+', request, '=', resolution); console.log();
                    done({
                        file: resolution
                    });
                }).catch(error => {
                    done(error);
                });
            }
        };

        let sassResult = await this.runSassAsync(sassOptions);

        // apparently, dart-sass broke source-map by only prepending the CSS without fixing the source-map!
        // https://github.com/sass/dart-sass/blob/3b6730369bdff9bb7859411c82e4b21f194d2514/lib/src/visitor/serialize.dart#L73
        let css: string = sassResult.css.toString('utf8');
        let charsetHeader = '@charset "UTF-8";\n';
        if (css.startsWith(charsetHeader)) {
            css = css.substring(charsetHeader.length);
        }

        let result: CssBuildResult = {
            css: css
        };

        if (this.flags.sourceMap && sassResult.map) {
            let sms: string = sassResult.map.toString('utf8');
            let sm1: RawSourceMap = JSON.parse(sms);
            this.fixSassGeneratedSourceMap(sm1);

            // console.log(sm.sources);
            // console.log(sm.file);

            result.map = sm1;
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
    async runPostCSS(virtualSassOutputPath: string, virtualPostcssOutputPath: string, sassResult: CssBuildResult) {
        let postcssOptions: postcss.ProcessOptions = {
            from: virtualSassOutputPath,
            to: virtualPostcssOutputPath
        };

        if (this.flags.sourceMap) {
            postcssOptions.map = {
                inline: false,
                prev: false
            };
        }

        let postcssResult = await postcss([
            autoprefixer()
        ]).process(sassResult.css, postcssOptions);

        let result: CssBuildResult = {
            css: postcssResult.css
        };

        if (this.flags.sourceMap && sassResult.map && postcssResult.map) {
            let sm2 = postcssResult.map.toJSON();
            let abs = upath.resolve(upath.dirname(virtualPostcssOutputPath), sm2.sources[0]);
            // console.log(abs);

            sm2.sources[0] = '/' + upath.relative(this.settings.root, abs);
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
    runCleanCSS(cssOutputPath: string, postcssResult: CssBuildResult) {
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
        let errors: Error[] = cleanResult.errors;
        if (errors.length) {
            let errorMessage = "Error when minifying CSS:\n" + errors.map(Q => Q.stack).join("\n\n");
            throw new Error(errorMessage);
        }

        let result: CssBuildResult = {
            css: cleanResult.styles
        };

        if (this.flags.sourceMap && postcssResult.map && cleanResult.sourceMap) {
            let sm3: RawSourceMap = cleanResult.sourceMap.toJSON();
            sm3.sources[0] = '/(intermediate)/(postcss-output).css';
            sm3.file = upath.basename(cssOutputPath);

            // console.log(sm3.sources);
            // console.log(sm3.file);

            result.map = mergeSourceMap(postcssResult.map, sm3);
            // console.log(result.map.sources);
            // console.log(result.map.file);

            let sourceMapFileName = upath.basename(cssOutputPath) + '.map';
            result.css += `\n/*# sourceMappingURL=${sourceMapFileName} */`;
        }

        return result;
    }

    /**
     * Builds the CSS project asynchronously.
     */
    async build() {
        let sassOutputPath = this.virtualSassOutputFilePath;
        let sassResult = await this.compileSassProject(sassOutputPath);

        let cssOutputPath = this.settings.outputCssFile;
        let postcssOutputPath = cssOutputPath;
        if (this.flags.production) {
            postcssOutputPath = this.virtualPostcssOutputFilePath;
        }

        let cssResult = await this.runPostCSS(sassOutputPath, postcssOutputPath, sassResult);

        if (this.flags.production) {
            cssResult = this.runCleanCSS(cssOutputPath, cssResult);
        }

        let cssOutputTask = outputFileThenLog(cssOutputPath, cssResult.css);

        if (cssResult.map) {
            cssResult.map.sourceRoot = 'instapack://';
            let s = JSON.stringify(cssResult.map);
            await outputFileThenLog(cssOutputPath + '.map', s);
        }

        await cssOutputTask;
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
