import fse from 'fs-extra';
import upath from 'upath';
import chalk from 'chalk';
import sass from 'sass';
import chokidar from 'chokidar';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
const CleanCSS = require('clean-css');
import { RawSourceMap } from 'source-map';
import mergeSourceMap from 'merge-source-map';
import { NodeJsInputFileSystem, ResolverFactory } from 'enhanced-resolve';

import { prettyHrTime } from './PrettyUnits';
import { Shout } from './Shout';
import { IVariables } from './interfaces/IVariables';
import { PathFinder } from './PathFinder';

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

    variables: IVariables;
    finder: PathFinder;

    /**
     * Constructs a new instance of SassBuildTool using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(variables: IVariables) {
        this.variables = variables;
        this.finder = new PathFinder(variables);
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
        return upath.join(this.finder.root, '(intermediate)', '(sass-output).css');
    }

    /**
     * Gets the full file path of the virtual Sass-Compiled CSS file. 
     */
    get virtualPostcssOutputFilePath() {
        return upath.join(this.finder.root, '(intermediate)', '(postcss-output).css');
    }

    /**
     * Normalize `sources` paths of a Sass-compiled source map.
     * @param sm 
     */
    fixSassGeneratedSourceMap(sm: RawSourceMap) {
        let folder = upath.basename(this.virtualSassOutputFilePath);
        sm.sources = sm.sources.map(s => {
            let absolute = upath.join(folder, s);
            return '/' + upath.relative(this.finder.root, absolute);
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
            let packagePartialPath = upath.join(this.finder.npmFolder, partialRequest);
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
        let cssInput = this.finder.cssEntry;

        let sassOptions: sass.Options = {
            file: cssInput,
            outFile: virtualSassOutputPath,
            data: await fse.readFile(cssInput, 'utf8'),

            sourceMap: this.variables.sourceMap,
            sourceMapContents: this.variables.sourceMap,

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

        let result: CssBuildResult = {
            css: sassResult.css.toString('utf8')
        };

        if (this.variables.sourceMap && sassResult.map) {
            let sms: string = sassResult.map.toString('utf8');
            let sm: RawSourceMap = JSON.parse(sms);
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
    async runPostCSS(virtualSassOutputPath: string, virtualPostcssOutputPath: string, sassResult: CssBuildResult) {
        let postcssOptions: postcss.ProcessOptions = {
            from: virtualSassOutputPath,
            to: virtualPostcssOutputPath
        };

        if (this.variables.sourceMap) {
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

        if (this.variables.sourceMap && sassResult.map && postcssResult.map) {
            let sm2 = postcssResult.map.toJSON();
            let abs = upath.resolve(upath.dirname(virtualPostcssOutputPath), sm2.sources[0]);
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
    runCleanCSS(cssOutputPath: string, postcssResult: CssBuildResult) {
        let cleanCssOptions = {
            level: {
                1: {
                    specialComments: false
                }
            },
            sourceMap: this.variables.sourceMap,
            sourceMapInlineSources: this.variables.sourceMap
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

        if (this.variables.sourceMap && postcssResult.map && cleanResult.sourceMap) {
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

        let cssOutputPath = this.finder.cssOutputFilePath;
        let postcssOutputPath = cssOutputPath;
        if (this.variables.production) {
            postcssOutputPath = this.virtualPostcssOutputFilePath;
        }

        let cssResult = await this.runPostCSS(sassOutputPath, postcssOutputPath, sassResult);

        if (this.variables.production) {
            cssResult = this.runCleanCSS(cssOutputPath, cssResult);
        }

        let cssOutputTask = Shout.fileOutput(cssOutputPath, cssResult.css);

        if (cssResult.map) {
            cssResult.map.sourceRoot = 'instapack://';
            let s = JSON.stringify(cssResult.map);
            await Shout.fileOutput(cssOutputPath + '.map', s);
        }

        await cssOutputTask;
    }

    /**
     * Executes build method with a formatted error and stopwatch wrapper. 
     */
    async buildWithStopwatch() {
        Shout.timed('Compiling', chalk.cyan('index.scss'), chalk.grey('in ' + this.finder.cssInputFolder + '/'));
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

        chokidar.watch(this.finder.scssGlob, {
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
