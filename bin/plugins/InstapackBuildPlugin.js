"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeScript = require("typescript");
const chalk = require("chalk");
const Shout_1 = require("../Shout");
const VoiceAssistant_1 = require("../VoiceAssistant");
const PrettyUnits_1 = require("../PrettyUnits");
const PathFinder_1 = require("../variables-factory/PathFinder");
class InstapackBuildPlugin {
    constructor(variables, languageTarget) {
        this.variables = variables;
        this.finder = new PathFinder_1.PathFinder(variables);
        this.va = new VoiceAssistant_1.VoiceAssistant(variables.mute);
        this.languageTarget = languageTarget;
    }
    apply(compiler) {
        const t = TypeScript.ScriptTarget[this.languageTarget].toUpperCase();
        compiler.hooks.compile.tap('typescript-compile-start', () => {
            Shout_1.Shout.timed('Compiling', chalk.cyan('index.ts'), '>>', chalk.yellow(t), chalk.grey('in ' + this.finder.jsInputFolder + '/'));
        });
        if (this.variables.production) {
            compiler.hooks.compilation.tap('typescript-minify-notify', compilation => {
                compilation.hooks.afterHash.tap('typescript-minify-notify', () => {
                    Shout_1.Shout.timed('TypeScript compilation finished! Minifying bundles...');
                });
            });
        }
        compiler.hooks.done.tapPromise('display-build-results', async (stats) => {
            const statsObject = stats.toJson(this.statsSerializeEssentialOption);
            this.displayBuildResults(statsObject);
            if (statsObject.time) {
                const t = PrettyUnits_1.prettyMilliseconds(statsObject.time);
                Shout_1.Shout.timed('Finished JS build after', chalk.green(t));
            }
            else {
                Shout_1.Shout.timed('Finished JS build.');
            }
        });
    }
    get statsSerializeEssentialOption() {
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
    formatError(error) {
        if (typeof error === 'object' && error.stack) {
            return `${error.moduleId} (${error.loc})\n ${error.stack}`;
        }
        else {
            return error === null || error === void 0 ? void 0 : error.toString();
        }
    }
    displayBuildResults(stats) {
        if (stats.errors.length) {
            const errorMessage = stats.errors.map(Q => this.formatError(Q)).join('\n\n') + '\n';
            Shout_1.Shout.error('during JS build:');
            console.error(chalk.red(errorMessage));
            this.va.speak(`JAVA SCRIPT BUILD: ${stats.errors.length} ERROR!`);
        }
        else {
            this.va.rewind();
        }
        if (stats.warnings.length) {
            const warningMessage = stats.warnings.map(Q => this.formatError(Q)).join('\n\n') + '\n';
            Shout_1.Shout.warning('during JS build:');
            console.warn(chalk.yellow(warningMessage));
        }
        if (stats.assets) {
            for (const asset of stats.assets) {
                if (asset.emitted) {
                    const kb = PrettyUnits_1.prettyBytes(asset.size);
                    const where = `in ${this.finder.jsOutputFolder}`;
                    Shout_1.Shout.timed(chalk.blue(asset.name), chalk.magenta(kb), chalk.grey(where));
                }
            }
        }
    }
}
exports.InstapackBuildPlugin = InstapackBuildPlugin;
