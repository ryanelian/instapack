import fse from 'fs-extra';
import chalk from 'chalk';

import { Shout } from './Shout';
import { IVariables } from './interfaces/IVariables';
import { PathFinder } from './PathFinder';
import { runTypeScriptBuildWorkerAsync, runSassBuildWorkerAsync, runTypeScriptCheckWorkerAsync } from './WorkerRunner';

/**
 * Contains methods for assembling and invoking the build tasks.
 */
export class ToolOrchestrator {

    private variables: IVariables;
    private finder: PathFinder;

    /**
     * Constructs a new instance of Compiler using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(variables: IVariables) {
        this.variables = variables;
        this.finder = new PathFinder(this.variables);
    }

    /**
     * Displays information about currently used build flags.
     */
    outputBuildInformation() {
        if (this.variables.watch) {
            Shout.timed(chalk.yellow("Watch"), "Mode: Source code will be automatically compiled on changes.");
        }

        if (this.variables.production) {
            Shout.timed(chalk.yellow("Production"), "Mode: Outputs minification is enabled.", chalk.red("(Slow build)"));
        } else {
            Shout.timed(chalk.yellow("Development"), "Mode: Outputs minification", chalk.red("is disabled!"), chalk.grey("(Fast build)"));
            Shout.timed(chalk.red("REMEMBER TO MINIFY"), "before pushing to production server!");
        }

        Shout.timed('Source Maps:', chalk.yellow(this.variables.sourceMap ? 'Enabled' : 'Disabled'));

        if (this.variables.stats) {
            Shout.timed('JS build stats:', chalk.cyan(this.finder.statsJsonFilePath));
        }
    }

    /**
     * Checks whether JS build task can be run.
     * If not, display validation error messages.
     */
    async validateJsBuildTask() {
        let entry = this.finder.jsEntry;
        let tsconfig = this.finder.tsConfigJson
        let checkEntry = fse.pathExists(entry);
        let checkProject = fse.pathExists(tsconfig);

        if (await checkEntry === false) {
            Shout.timed('Entry file', chalk.cyan(entry), 'was not found.', chalk.red('Aborting JS build!'));
            return false;
        }

        if (await checkProject === false) {
            Shout.timed('Project file', chalk.cyan(tsconfig), 'was not found.', chalk.red('Aborting JS build!'));
            return false;
        }

        return true;
    }

    /**
     * Checks whether the CSS build task can be run.
     * If not, display validation error messages.
     */
    async validateCssBuildTask() {
        let entry = this.finder.cssEntry;
        let exist = await fse.pathExists(entry);
        if (!exist) {
            Shout.timed('Entry file', chalk.cyan(entry), 'was not found.', chalk.red('Aborting CSS build!'));
        }
        return exist;
    }

    async build(taskName: string) {
        switch (taskName) {
            case 'all':
                this.build('js');
                this.build('css');
                return;

            case 'js': {
                let valid = await this.validateJsBuildTask();
                if (valid) {
                    runTypeScriptBuildWorkerAsync(this.variables).catch(error => {
                        Shout.fatal(`during JS build:`, error);
                        Shout.notify(`FATAL ERROR during JS build!`);
                    });
                    runTypeScriptCheckWorkerAsync(this.variables).catch(error => {
                        Shout.fatal(`during type-checking:`, error);
                        Shout.notify(`FATAL ERROR during type-checking!`);
                    });
                }
                return;
            }

            case 'css': {
                let valid = await this.validateCssBuildTask();
                if (valid) {
                    runSassBuildWorkerAsync(this.variables).catch(error => {
                        Shout.fatal(`during CSS build:`, error);
                        Shout.notify(`FATAL ERROR during CSS build!`);
                    });
                }
                return;
            }

            default:
                throw Error('Task `' + taskName + '` does not exists!');
        }
    }
}