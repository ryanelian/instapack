import * as TypeScript from 'typescript';
import webpack = require("webpack");
import chalk = require("chalk");

import { Shout } from "../Shout";
import { VoiceAssistant } from "../VoiceAssistant";
import { prettyBytes, prettyMilliseconds } from "../PrettyUnits";
import { BuildVariables } from "../variables-factory/BuildVariables";
import { PathFinder } from "../variables-factory/PathFinder";
import type { WebpackError, InstapackStats } from '../WebpackInternalTypes';

export class InstapackBuildPlugin {
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
            });
        }

        compiler.hooks.done.tapPromise('display-build-results', async stats => {
            const statsObject = stats.toJson(this.statsSerializeEssentialOption);
            this.displayBuildResults(statsObject);

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
    get statsSerializeEssentialOption(): unknown {
        return {
            assets: true,
            cached: false,
            cachedAssets: false,
            children: false,
            chunkModules: false,
            chunkOrigins: false,
            chunks: false,
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

    formatError(error: string | WebpackError): string {
        // webpack 5 have changed error / warning stats data to array of objects
        // instead of array of strings https://github.com/webpack/webpack/issues/9802#issuecomment-569966784
        if (typeof error === 'object' && error.stack) {
            return `${error.moduleId} (${error.loc})\n ${error.stack}`;
        } else {
            return error?.toString();
        }
    }

    /**
     * Interact with user via CLI output when TypeScript build is finished.
     * @param stats 
     */
    displayBuildResults(stats: InstapackStats): void {
        if (stats.errors.length) {
            const errorMessage = stats.errors.map(Q => this.formatError(Q)).join('\n\n') + '\n';
            Shout.error('during JS build:');
            console.error(chalk.red(errorMessage));
            this.va.speak(`JAVA SCRIPT BUILD: ${stats.errors.length} ERROR!`);
        } else {
            this.va.rewind();
        }

        if (stats.warnings.length) {
            const warningMessage = stats.warnings.map(Q => this.formatError(Q)).join('\n\n') + '\n';
            Shout.warning('during JS build:');
            console.warn(chalk.yellow(warningMessage));
        }

        if (stats.assets) {
            for (const asset of stats.assets) {
                if (asset.emitted) {
                    const kb = prettyBytes(asset.size);
                    const where = `in ${this.finder.jsOutputFolder}`;
                    Shout.timed(chalk.blue(asset.name), chalk.magenta(kb), chalk.grey(where));
                }
            }
        }
    }
}
