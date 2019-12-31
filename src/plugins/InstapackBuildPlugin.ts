import * as url from 'url';
import * as upath from 'upath';
import * as fse from 'fs-extra';
import * as TypeScript from 'typescript';
import webpack = require("webpack");
import chalk = require("chalk");

import { Shout } from "../Shout";
import { VoiceAssistant } from "../VoiceAssistant";
import { prettyBytes, prettyMilliseconds } from "../PrettyUnits";
import { BuildVariables } from "../variables-factory/BuildVariables";
import { PathFinder } from "../variables-factory/PathFinder";

export class InstapackBuildPlugin {

    /**
     * Keep track of Hot Reload script injection file names already created.
     */
    private readonly wormholes: Set<string> = new Set<string>();

    variables: BuildVariables;

    finder: PathFinder;

    private va: VoiceAssistant;

    languageTarget: TypeScript.ScriptTarget;

    constructor(variables: BuildVariables, languageTarget: TypeScript.ScriptTarget) {
        this.variables = variables;
        this.finder = new PathFinder(variables);
        this.va = new VoiceAssistant(variables.mute);
        this.languageTarget = languageTarget;
    }

    apply(compiler: webpack.Compiler): void {
        const t = TypeScript.ScriptTarget[this.languageTarget].toUpperCase();

        compiler.hooks.compile.tap('typescript-compile-start', () => {
            Shout.timed('Compiling', chalk.cyan('index.ts'),
                '>>', chalk.yellow(t),
                chalk.grey('in ' + this.finder.jsInputFolder + '/')
            );
        });

        if (this.variables.production) {
            compiler.hooks.compilation.tap('typescript-minify-notify', compilation => {
                compilation.hooks.afterHash.tap('typescript-minify-notify', () => {
                    Shout.timed('TypeScript compilation finished! Minifying bundles...');
                });

                // https://github.com/webpack/tapable/issues/116
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return undefined as any;
            });
        }

        compiler.hooks.done.tapPromise('display-build-results', async stats => {
            const statsObject = stats.toJson(this.statsSerializeEssentialOption);
            const outputPublicPath = compiler.options.output?.publicPath;
            this.displayBuildResults(statsObject, outputPublicPath);

            if (this.variables.serve) {
                if (outputPublicPath) {
                    await this.putInjectionScripts(statsObject, outputPublicPath);
                } else {
                    Shout.error(new Error('instapack: Cannot create injection scripts due to undefined output.publicPath webpack option!'));
                }
            }

            if (statsObject.time) {
                const t = prettyMilliseconds(statsObject.time);
                Shout.timed('Finished JS build after', chalk.green(t));
            } else {
                Shout.timed('Finished JS build.');
            }
        });
    }

    /**
     * Get stat objects required for instapack build logs.
     */
    get statsSerializeEssentialOption(): webpack.Stats.ToJsonOptions {
        return {
            assets: true,
            cached: false,
            cachedAssets: false,
            children: false,
            chunkModules: false,
            chunkOrigins: false,
            chunks: this.variables.serve,
            depth: false,
            entrypoints: false,
            env: false,
            errors: true,
            errorDetails: false,
            hash: false,
            modules: false,
            moduleTrace: true,
            publicPath: false,
            reasons: false,
            source: false,
            timings: true,
            version: false,
            warnings: true,
            usedExports: false,
            performance: false,
            providedExports: false
        };
    }

    formatError(error): string {
        // webpack 5 might have changed error / warning stats data to array of objects
        // instead of array of strings https://github.com/webpack/webpack/issues/9802#issuecomment-569966784
        if (error.stack) {
            return `${error.moduleId} (${error.loc})\n ${error.stack}`;
        } else {
            return error;
        }
    }

    /**
     * Interact with user via CLI output when TypeScript build is finished.
     * @param stats 
     */
    displayBuildResults(stats: webpack.Stats.ToJsonOutput, outputPublicPath: string | undefined): void {
        const errors: string[] = stats.errors;
        if (errors.length) {
            const errorMessage = errors.map(Q => this.formatError(Q)).join('\n\n') + '\n';
            Shout.error('during JS build:');
            console.error(chalk.red(errorMessage));
            this.va.speak(`JAVA SCRIPT BUILD: ${errors.length} ERROR!`);
        } else {
            this.va.rewind();
        }

        const warnings: string[] = stats.warnings;
        if (warnings.length) {
            const warningMessage = warnings.map(Q => this.formatError(Q)).join('\n\n') + '\n';
            Shout.warning('during JS build:');
            console.warn(chalk.yellow(warningMessage));
        }

        if (stats.assets) {
            for (const asset of stats.assets) {
                if (asset.emitted) {
                    const kb = prettyBytes(asset.size);
                    const where = 'in ' + (this.variables.serve ? outputPublicPath : this.finder.jsOutputFolder);
                    Shout.timed(chalk.blue(asset.name), chalk.magenta(kb), chalk.grey(where));
                }
            }
        }
    }

    async putInjectionScripts(stats: webpack.Stats.ToJsonOutput, outputPublicPath: string): Promise<void> {
        if (!stats.chunks) {
            Shout.error(new Error('Cannot create injection scripts due to undefined stats chunk!'));
            return;
        }

        const tasks: Promise<void>[] = [];
        for (const chunk of stats.chunks) {
            if (chunk.initial === false) {
                continue;
            }

            for (const file of chunk.files) {
                if (file.includes('.hot-update.js')) {
                    continue;
                }

                if (this.wormholes.has(file)) {
                    continue;
                }

                const task = this.putInjectionScript(file, outputPublicPath);
                tasks.push(task);
                this.wormholes.add(file);
            }
        }

        try {
            await Promise.all(tasks);
        } catch (error) {
            Shout.error('creating injection scripts!', error);
        }
    }

    /**
     * Create an injection script in place of the output file.
     */
    putInjectionScript(fileName: string, outputPublicPath: string): Promise<void> {
        const physicalFilePath = upath.join(this.finder.jsOutputFolder, fileName);
        const hotUri = url.resolve(outputPublicPath, fileName);
        Shout.timed(`Inject <script> ${chalk.cyan(physicalFilePath)} --> ${chalk.cyan(hotUri)}`);
        const hotProxy = this.createInjectionScriptToHotReloadingScript(hotUri);
        return fse.outputFile(physicalFilePath, hotProxy);
    }

    /**
     * Create a fake physical source code for importing the real hot-reloading source code.
     * @param uri 
     */
    createInjectionScriptToHotReloadingScript(uri: string): string {
        // https://developer.mozilla.org/en-US/docs/Glossary/IIFE
        return `// instapack Script Injection: automagically reference the real hot-reloading script
(function () {
    var body = document.getElementsByTagName('body')[0];

    var target = document.createElement('script');
    target.src = '${uri}';
    body.appendChild(target);
})();
`;
    }
}