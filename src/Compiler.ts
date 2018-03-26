import * as fse from 'fs-extra';
import chalk from 'chalk';
import * as chokidar from 'chokidar';
import * as upath from 'upath';
import { fork, ChildProcess } from 'child_process';

import hub from './EventHub';
import { TypeScriptBuildTool } from './TypeScriptBuildTool';
import { TypeScriptCheckerTool } from './TypeScriptCheckerTool';
import { SassBuildTool } from './SassBuildTool';
import { ConcatBuildTool } from './ConcatBuildTool';
import { Settings, ISettingsCore } from './Settings';
import { ICompilerFlags } from './CompilerUtilities';
import { Shout } from './Shout';

/**
 * Represents POJO serializable build metadata for child Compiler process.
 */
interface IBuildCommand {
    build: string;
    root: string;
    settings: ISettingsCore;
    flags: ICompilerFlags;
}

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
    private readonly flags: ICompilerFlags;

    /**
     * Stores the initial instapack build command from user.
     */
    private _userBuildTaskParameter: string;

    /**
     * Store all build child processes spawned.
     */
    private buildTasks: ChildProcess[] = [];

    /**
     * Constructs a new instance of Compiler using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(settings: Settings, flags: ICompilerFlags) {
        this.settings = settings;
        this.flags = flags;
    }

    /**
     * Constructs Compiler instance from child process build command.
     * @param command 
     */
    static fromCommand(command: IBuildCommand) {
        let settings = new Settings(command.root, command.settings);
        let compiler = new Compiler(settings, command.flags);
        return compiler;
    }

    /**
     * Displays information about currently used build flags.
     */
    private chat() {
        Shout.timed('Output to folder', chalk.cyan(this.settings.outputFolder));

        if (this.flags.production) {
            Shout.timed(chalk.yellow("Production"), "Mode: Outputs will be minified.", chalk.red("(Slow build)"));
        } else {
            Shout.timed(chalk.yellow("Development"), "Mode: Outputs will", chalk.red("NOT be minified!"), "(Fast build)");
            Shout.timed(chalk.red("Do not forget to minify"), "before pushing to repository or production server!");
        }

        if (this.flags.watch) {
            Shout.timed(chalk.yellow("Watch"), "Mode: Source codes will be automatically compiled on changes.");
        }

        if (!this.flags.production || this.flags.watch) {
            this.flags.analyze = false;
        }

        if (this.flags.analyze) {
            let analysisPath = this.settings.outputJsFolder + '/analysis.html';
            Shout.timed(chalk.yellow('Analyze'), 'Mode:', chalk.cyan(analysisPath));
        }

        Shout.timed('Source Maps:', chalk.yellow(this.flags.sourceMap ? 'Enabled' : 'Disabled'));
    }

    /**
     * Launch Node.js child process using this same Compiler module for building in separate process. 
     * @param taskName 
     */
    private async startBackgroundTask(taskName: string) {
        if (taskName === 'all') {
            let t1 = this.startBackgroundTask('js');
            let t2 = this.startBackgroundTask('css');
            let t3 = this.startBackgroundTask('concat');
            await Promise.all([t1, t2, t3]);
            return;
        }

        let valid = await this.validateBackgroundTask(taskName);
        if (!valid) {
            return;
        }

        let child = fork(__filename);
        child.send({
            build: taskName,
            root: this.settings.root,
            flags: this.flags,
            settings: this.settings.core
        } as IBuildCommand);

        this.buildTasks.push(child);

        if (taskName === 'js') {
            await this.startBackgroundTask('type-checker');
        }
    }

    /**
     * Checks whether a build task should be run.
     * @param taskName 
     */
    private async validateBackgroundTask(taskName: string) {
        switch (taskName) {
            case 'js': {
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
            case 'css': {
                let entry = this.settings.cssEntry;
                let exist = await fse.pathExists(entry);
                if (!exist) {
                    Shout.timed('Entry file', chalk.cyan(entry), 'was not found.', chalk.red('Aborting CSS build!'));
                }
                return exist;
            }
            case 'concat': {
                return (this.settings.concatCount > 0);
            }
            case 'type-checker': {
                return true;
            }
            default: {
                throw Error('Task `' + taskName + '` does not exists!');
            }
        }
    }

    /**
     * Kill all build tasks, and then destroy them.
     */
    killAllBuilds() {
        for (let task of this.buildTasks) {
            task.kill();
        }
        this.buildTasks = [];
    }

    /**
     * Restart invoked build task(s) when package.json and tsconfig.json are edited!
     */
    restartBuildsOnConfigurationChanges() {
        chokidar.watch([this.settings.packageJson, this.settings.tsConfigJson], {
            ignoreInitial: true
        })
            .on('change', (file: string) => {
                file = upath.toUnix(file);

                Shout.timed(chalk.cyan(file), 'was edited. Restarting builds...');
                this.killAllBuilds();
                this.settings = Settings.tryReadFromPackageJson(this.settings.root);
                this.build(this._userBuildTaskParameter);
            })
            .on('unlink', (file: string) => {
                file = upath.toUnix(file);

                Shout.timed(chalk.cyan(file), 'was deleted.', chalk.red('BAD IDEA!')); // "wtf are you doing?"
            });
    }

    /**
     * Runs the selected build task.
     * @param taskName 
     */
    build(taskName: string) {
        let task: Promise<void>;

        if (process.send === undefined) {
            // parent
            if (!this._userBuildTaskParameter) {
                this._userBuildTaskParameter = taskName;
                this.chat();
                if (this.flags.watch) {
                    this.restartBuildsOnConfigurationChanges();
                }
            }

            task = this.startBackgroundTask(taskName);
        } else {
            // child
            switch (taskName) {
                case 'js': {
                    task = this.buildJS();
                    break;
                }
                case 'css': {
                    task = this.buildCSS();
                    break;
                }
                case 'concat': {
                    task = this.buildConcat();
                    break;
                }
                case 'type-checker': {
                    task = this.checkTypeScript();
                    break;
                }
                default: {
                    throw Error(`Task '${taskName}' does not exists!`);
                }
            }

            // console.log(taskName);
        }

        task.catch(error => {
            Shout.fatal(`during ${taskName.toUpperCase()} build:`, error);
            hub.buildDone();
        });
    }

    /**
     * Compiles the JavaScript project.
     */
    async buildJS() {
        await fse.remove(this.settings.outputJsSourceMap);
        let tool = new TypeScriptBuildTool(this.settings, this.flags);
        tool.build();
    }

    /**
     * Compiles the CSS project.
     */
    async buildCSS() {
        await fse.remove(this.settings.outputCssSourceMap);
        let tool = new SassBuildTool(this.settings, this.flags);
        await tool.buildWithStopwatch();

        if (this.flags.watch) {
            tool.watch();
        }
    }

    /**
     * Concat JavaScript files.
     */
    async buildConcat() {
        Shout.timed('Resolving', chalk.green(this.settings.concatCount.toString()), 'concat target(s)...');

        let tool = new ConcatBuildTool(this.settings, this.flags);
        await tool.buildWithStopwatch();
    }

    /**
     * Static-check the TypeScript project.
     */
    async checkTypeScript() {
        let tool = new TypeScriptCheckerTool(this.settings);
        tool.typeCheck();

        if (this.flags.watch) {
            tool.watch();
        }
    }
}

if (process.send) { // Child Process
    process.on('message', (command: IBuildCommand) => {
        // console.log(command);
        if (command.build) {
            if (!command.flags.watch || command.build === 'concat') {
                hub.exitOnBuildDone();
            }

            Compiler.fromCommand(command).build(command.build);
        }
    });
}
