import * as fse from 'fs-extra';
import chalk = require('chalk');

import { Shout } from './Shout';
import { BuildVariables } from './variables-factory/BuildVariables';
import { PathFinder } from './variables-factory/PathFinder';
import { runTypeScriptBuildWorker, runSassBuildWorker, runTypeScriptCheckWorker, runCopyBuildWorker } from './workers/RunWorker';
import { VoiceAssistant } from './VoiceAssistant';

/**
 * Contains methods for assembling and invoking the build tasks.
 */
export class ToolOrchestrator {

    private variables: BuildVariables;
    private finder: PathFinder;

    /**
     * Constructs a new instance of Compiler using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(variables: BuildVariables) {
        this.variables = variables;
        this.finder = new PathFinder(this.variables);
    }

    /**
     * Displays information about currently used build flags.
     */
    outputBuildInformation(): void {
        if (this.variables.production) {
            Shout.timed(chalk.yellow("Production"), "Mode: Build optimizations are enabled.");
        } else {
            Shout.timed(chalk.yellow("Development"), "Mode: Build optimizations are", chalk.red("DISABLED!"), chalk.grey("(Fast build)"));
        }

        if (this.variables.watch) {
            Shout.timed(chalk.yellow("Watch"), "Mode: Source code will be automatically compiled on changes.");
        }

        let smState = chalk.yellow(this.variables.sourceMap ? 'Enabled' : 'Disabled');
        if (!this.variables.production && this.variables.watch) {
            smState = smState + ' ' + chalk.grey('(Inlined JS)');
        }
        Shout.timed('Source Maps:', smState);

        if (this.variables.stats) {
            Shout.timed('JS build stats:', chalk.cyan(this.finder.statsJsonFilePath));
        }
    }

    /**
     * Checks whether JS build task can be run.
     * If not, display validation error messages.
     */
    async validateJsBuildTask(): Promise<boolean> {
        const entry = this.finder.jsEntry;
        const checkEntry = fse.pathExists(entry);

        if (await checkEntry === false) {
            Shout.timed('Entry file', chalk.cyan(entry), 'was not found.', chalk.red('Aborting JS build!'));
            return false;
        }

        return true;
    }

    /**
     * Checks whether the CSS build task can be run.
     * If not, display validation error messages.
     */
    async validateCssBuildTask(): Promise<boolean> {
        const entry = this.finder.cssEntry;
        const exist = await fse.pathExists(entry);
        if (!exist) {
            Shout.timed('Entry file', chalk.cyan(entry), 'was not found.', chalk.red('Aborting CSS build!'));
        }
        return exist;
    }

    async build(taskName: string): Promise<void> {
        switch (taskName) {
            case 'all':
                this.build('js');
                this.build('css');
                this.build('copy');
                return;

            case 'js': {
                const valid = await this.validateJsBuildTask();
                if (valid) {
                    runTypeScriptBuildWorker(this.variables).catch(error => {
                        Shout.fatal(`during JS build:`, error);
                        const va = new VoiceAssistant(this.variables.mute);
                        va.speak(`JAVASCRIPT BUILD FATAL ERROR!`);
                    });
                    runTypeScriptCheckWorker(this.variables).catch(error => {
                        Shout.fatal(`during type-checking:`, error);
                        const va = new VoiceAssistant(this.variables.mute);
                        va.speak(`TYPE CHECK FATAL ERROR!`);
                    });
                }
                return;
            }

            case 'css': {
                const valid = await this.validateCssBuildTask();
                if (valid) {
                    runSassBuildWorker(this.variables).catch(error => {
                        Shout.fatal(`during CSS build:`, error);
                        const va = new VoiceAssistant(this.variables.mute);
                        va.speak(`CSS BUILD FATAL ERROR!`);
                    });
                }
                return;
            }

            case 'copy': {
                if (this.variables.copy.length) {
                    runCopyBuildWorker(this.variables).catch(error => {
                        Shout.fatal(`during Copy Assets job:`, error);
                        const va = new VoiceAssistant(this.variables.mute);
                        va.speak(`COPY ASSETS FATAL ERROR!`);
                    });
                }
                return;
            }

            default:
                throw Error('Task `' + taskName + '` does not exists!');
        }
    }
}
