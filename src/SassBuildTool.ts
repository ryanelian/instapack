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
     * Builds the CSS project asynchronously.
     */
    async build() {
        let cssInput = this.settings.cssEntry;
        let cssOutput = this.settings.outputCssFile;

        let sassOutput = this.virtualSassOutputFilePath;
        let postcssOutput = cssOutput;
        if (this.flags.production) {
            postcssOutput = this.virtualPostcssOutputFilePath;
        }

        let sassOptions: sass.Options = {
            file: cssInput,
            outFile: sassOutput,
            data: await fse.readFile(cssInput, 'utf8'),

            sourceMap: this.flags.sourceMap,
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

        let postcssOptions: postcss.ProcessOptions = {
            from: sassOutput,
            to: postcssOutput
        };

        if (this.flags.sourceMap) {
            postcssOptions.map = {
                inline: false,
                prev: false
            };
        }

        // dart-sass broke source-map by only prepending the CSS without fixing the source-map!
        // https://github.com/sass/dart-sass/blob/3b6730369bdff9bb7859411c82e4b21f194d2514/lib/src/visitor/serialize.dart#L73
        let postcssInput: string = sassResult.css.toString('utf8');
        let charsetHeader = '@charset "UTF-8";\n';
        if (postcssInput.startsWith(charsetHeader)) {
            postcssInput = postcssInput.substring(charsetHeader.length);
        }

        let cssResult = await postcss([
            autoprefixer()
        ]).process(postcssInput, postcssOptions);

        let css = cssResult.css;
        let sm: RawSourceMap;

        if (this.flags.sourceMap && sassResult.map && cssResult.map) {
            let sms1: string = sassResult.map.toString('utf8');
            let sm1: RawSourceMap = JSON.parse(sms1);
            this.fixSassGeneratedSourceMap(sm1);

            // console.log(sm1.sources);
            // console.log(sm1.file);

            let sm2 = cssResult.map.toJSON();
            let abs = upath.resolve(upath.dirname(postcssOutput), sm2.sources[0]);
            // console.log(abs);
            sm2.sources[0] = '/' + upath.relative(this.settings.root, abs);

            // console.log(sm2.sources);
            // console.log(sm2.file);

            sm = mergeSourceMap(sm1, sm2);
            /*
            => Found "merge-source-map@1.1.0"
            info Reasons this module exists
            - Hoisted from "vue-loader#@vue#component-compiler-utils#merge-source-map"
            */
        }

        if (this.flags.production) {
            let cleanCssOptions = {
                level: {
                    1: {
                        specialComments: false
                    }
                },
                sourceMap: this.flags.sourceMap,
                sourceMapInlineSources: this.flags.sourceMap
            };

            let cleanResult = new CleanCSS(cleanCssOptions).minify(css);
            let errors: Error[] = cleanResult.errors;
            if (errors.length) {
                let errorMessage = "Error when minifying CSS:\n" + errors.map(Q => Q.stack).join("\n\n");
                throw new Error(errorMessage);
            }

            css = cleanResult.styles;
            if (this.flags.sourceMap && sm && cleanResult.sourceMap) {
                let sm3: RawSourceMap = cleanResult.sourceMap.toJSON();
                sm3.sources[0] = '/(intermediate)/(postcss-output).css';
                sm3.file = upath.basename(cssOutput);

                // console.log(sm3.sources);
                // console.log(sm3.file);

                sm = mergeSourceMap(sm, sm3);
                // console.log(sm.sources);
                // console.log(sm.file);

                let sourceMapFileName = upath.basename(cssOutput) + '.map';
                css += '\n' + `/*# sourceMappingURL=${sourceMapFileName} */`;
            }
        }

        let cssOutputTask = outputFileThenLog(cssOutput, css);

        if (sm) {
            sm.sourceRoot = 'instapack://';
            await outputFileThenLog(cssOutput + '.map', JSON.stringify(sm));
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
