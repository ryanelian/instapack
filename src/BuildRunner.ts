import * as fse from 'fs-extra';
import chalk = require('chalk');

import { Shout } from './Shout';
import { BuildVariables } from './variables-factory/BuildVariables';
import { PathFinder } from './variables-factory/PathFinder';
import { BuildWorkerManager } from './BuildWorkerManager';

/**
 * Contains methods for assembling and invoking the build tasks.
 */
export class BuildRunner {

    private variables: BuildVariables;
    private finder: PathFinder;
    private buildWorker: BuildWorkerManager;

    /**
     * Constructs a new instance of Compiler using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(variables: BuildVariables) {
        this.variables = variables;
        this.finder = new PathFinder(this.variables);
        this.buildWorker = new BuildWorkerManager();
    }

    /**
     * Displays information about currently used build flags.
     */
    outputBuildInformation(): void {
        if (this.variables.reactRefresh) {
            Shout.warning(`Experimental ${chalk.yellowBright('React Fast Refresh')} dev server is enabled!`);
        }

        if (this.variables.production) {
            Shout.timed(chalk.yellowBright("Production"), "Mode: Build optimizations are enabled.");
        } else {
            Shout.timed(chalk.yellowBright("Development"), "Mode: Build optimizations are", chalk.redBright("DISABLED!"), chalk.grey("(Fast build)"));
        }

        if (this.variables.watch) {
            Shout.timed(chalk.yellowBright("Watch"), "Mode: Source code will be automatically compiled on changes.");
        }

        let smState = chalk.yellowBright(this.variables.sourceMap ? 'Enabled' : 'Disabled');
        if (this.variables.production) {
            smState = smState + ' ' + chalk.grey('(Hidden)');
        } else if (this.variables.watch) {
            smState = smState + ' ' + chalk.grey('(Inlined, Eval)');
        }
        Shout.timed('Source Maps:', smState);

        if (this.variables.stats) {
            Shout.timed('JS build stats:', chalk.cyanBright(this.finder.statsJsonFilePath));
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
            Shout.timed('Entry file', chalk.cyanBright(entry), 'was not found.', chalk.redBright('Aborting JS build!'));
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
            Shout.timed('Entry file', chalk.cyanBright(entry), 'was not found.', chalk.redBright('Aborting CSS build!'));
        }
        return exist;
    }

    build(taskName: string): void {
        if (taskName === 'all') {
            this.build('js');
            this.build('css');
            this.build('copy');
        } else if (taskName === 'js') {
            const valid = this.validateJsBuildTask();
            if (valid) {
                this.buildWorker.runJsBuildWorker(this.variables);
                this.buildWorker.runTypeCheckBuildWorker(this.variables);
            }
        } else if (taskName === 'css') {
            const valid = this.validateCssBuildTask();
            if (valid) {
                this.buildWorker.runCssBuildWorker(this.variables);
            }
        } else if (taskName === 'copy') {
            if (this.variables.copy.length) {
                this.buildWorker.runCopyBuildWorker(this.variables);
            }
        } else {
            throw new Error(`Unknown build name: ${taskName}`);
        }
    }
}
