import * as fse from 'fs-extra';
import chalk from 'chalk';
import * as chokidar from 'chokidar';
import * as upath from 'upath';
import * as WorkerFarm from 'worker-farm';
import { Settings } from './Settings';
import { Shout } from './Shout';

let TypeScriptBuildWorker = WorkerFarm(require.resolve('./build-workers/TypeScriptBuildWorker'));
let TypeScriptCheckWorker = WorkerFarm(require.resolve('./build-workers/TypeScriptCheckWorker'));
let SassBuildWorker = WorkerFarm(require.resolve('./build-workers/SassBuildWorker'));
let ConcatBuildWorker = WorkerFarm(require.resolve('./build-workers/ConcatBuildWorker'));

/**
 * Contains methods for assembling and invoking the build tasks.
 */
export class Compiler {

    /**
     * Gets or sets the project settings.
     */
    private settings: Settings;

    /**
     * Gets the compiler build flags.
     */
    private readonly flags: IBuildFlags;

    /**
     * Constructs a new instance of Compiler using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(settings: Settings, flags: IBuildFlags) {
        this.settings = settings;
        this.flags = flags;
    }

    /**
     * Displays information about currently used build flags.
     */
    private chat() {
        if (this.flags.watch) {
            Shout.timed(chalk.yellow("Watch"), "Mode: Source code will be automatically compiled on changes.");
        }

        if (this.flags.production) {
            Shout.timed(chalk.yellow("Production"), "Mode: Outputs minification is enabled.", chalk.red("(Slow build)"));
        } else {
            Shout.timed(chalk.yellow("Development"), "Mode: Outputs minification", chalk.red("is disabled!"), chalk.grey("(Fast build)"));
            Shout.timed(chalk.red("REMEMBER TO MINIFY"), "before pushing to production server!");
        }

        if (!this.flags.production || this.flags.watch) {
            this.flags.stats = false;
        }

        Shout.timed('Source Maps:', chalk.yellow(this.flags.sourceMap ? 'Enabled' : 'Disabled'));

        if (this.flags.stats) {
            Shout.timed('JS build stats:', chalk.cyan(this.settings.statJsonPath));
        }
    }

    /**
     * Checks whether JS build task can be run.
     * If not, display validation error messages.
     */
    private async validateJsBuildTask() {
        let entry = this.settings.jsEntry;
        let tsconfig = this.settings.tsConfigJson
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
    private async validateCssBuildTask() {
        let entry = this.settings.cssEntry;
        let exist = await fse.pathExists(entry);
        if (!exist) {
            Shout.timed('Entry file', chalk.cyan(entry), 'was not found.', chalk.red('Aborting CSS build!'));
        }
        return exist;
    }

    /**
     * Display build information then run relevant build tasks.
     * @param taskName 
     */
    build(taskName: string) {
        this.chat();
        // if (this.flags.watch) {
        //     this.restartBuildsOnConfigurationChanges(taskName);
        // }

        this.__build(taskName);
    }

    /**
     * Gets the POJO-serializable build worker input payload.
     */
    get buildCommand(): IBuildCommand {
        return {
            root: this.settings.root,
            flags: this.flags,
            settings: this.settings.core
        }
    };

    /**
     * Run build workers for the input task.
     * @param taskName 
     */
    private async __build(taskName: string) {
        switch (taskName) {
            case 'all':
                this.__build('js');
                this.__build('css');
                this.__build('concat');
                return;

            case 'js':
                let valid = await this.validateJsBuildTask();
                if (valid) {
                    TypeScriptBuildWorker(this.buildCommand, (error, result) => {
                        if (error) {
                            Shout.fatal(`during JS build:`, error);
                            Shout.notify(`FATAL ERROR during JS build!`);
                        }
                        WorkerFarm.end(TypeScriptBuildWorker);
                    });
                    TypeScriptCheckWorker(this.buildCommand, (error, result) => {
                        if (error) {
                            Shout.fatal(`during type-checking:`, error);
                            Shout.notify(`FATAL ERROR during type-checking!`);
                        }
                        WorkerFarm.end(TypeScriptCheckWorker);
                    });
                }
                return;

            case 'css': {
                let valid = await this.validateCssBuildTask();
                if (valid) {
                    SassBuildWorker(this.buildCommand, (error, result) => {
                        if (error) {
                            Shout.fatal(`during CSS build:`, error);
                            Shout.notify(`FATAL ERROR during CSS build!`);
                        }
                        WorkerFarm.end(SassBuildWorker);
                    });
                }
                return;
            }

            case 'concat': {
                let valid = (this.settings.concatCount > 0);
                if (valid) {
                    ConcatBuildWorker(this.buildCommand, (error, result) => {
                        if (error) {
                            Shout.fatal(`during JS concat:`, error);
                            Shout.notify(`FATAL ERROR during JS concat!`);
                        }
                        WorkerFarm.end(ConcatBuildWorker);
                    });
                }
                return;
            }

            default:
                throw Error('Task `' + taskName + '` does not exists!');
        }
    }
}
