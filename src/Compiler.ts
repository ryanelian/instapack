import * as fse from 'fs-extra';
import chalk from 'chalk';
import { fork } from 'child_process';

import hub from './EventHub';
import { TypeScriptBuildTool } from './TypeScriptBuildTool';
import { TypeScriptCheckerTool } from './TypeScriptCheckerTool';
import { SassBuildTool } from './SassBuildTool';
import { ConcatBuildTool } from './ConcatBuildTool';
import { Settings, ISettingsCore } from './Settings';
import { timedLog, ICompilerFlags } from './CompilerUtilities';

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
     * Gets the project settings.
     */
    private readonly settings: Settings;

    /**
     * Gets the compiler build flags.
     */
    private readonly flags: ICompilerFlags;

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
        timedLog('Output to folder', chalk.cyan(this.settings.outputFolder));

        if (this.flags.production) {
            timedLog(chalk.yellow("Production"), "Mode: Outputs will be minified.", chalk.red("(Slow build)"));
        } else {
            timedLog(chalk.yellow("Development"), "Mode: Outputs will", chalk.red("NOT be minified!"), "(Fast build)");
            timedLog(chalk.red("Do not forget to minify"), "before pushing to repository or production server!");
        }

        if (this.flags.watch) {
            timedLog(chalk.yellow("Watch"), "Mode: Source codes will be automatically compiled on changes.");
        }

        timedLog('Source Maps:', chalk.yellow(this.flags.sourceMap ? 'Enabled' : 'Disabled'));
    }

    /**
     * Launch Node.js child process using this same Compiler module for building in separate process. 
     * @param taskName 
     */
    private startBackgroundTask(taskName: string) {
        if (taskName === 'all') {
            this.startBackgroundTask('js');
            this.startBackgroundTask('css');
            this.startBackgroundTask('concat');
            return;
        }

        let valid = this.validateBackgroundTask(taskName);
        if (valid) {
            // console.log(__filename);            
            let child = fork(__filename);
            child.send({
                build: taskName,
                root: this.settings.root,
                flags: this.flags,
                settings: this.settings.core
            } as IBuildCommand);

            if (taskName === 'js') {
                this.startBackgroundTask('type-checker');
            }
        }
    }

    /**
     * Checks whether a build task should be run.
     * @param taskName 
     */
    private validateBackgroundTask(taskName: string) {
        switch (taskName) {
            case 'js': {
                let entry = this.settings.jsEntry;
                let exist = fse.pathExistsSync(entry);
                if (!exist) {
                    timedLog('Entry file', chalk.cyan(entry), 'was not found.', chalk.red('Aborting JS build.'));
                }
                return exist;
            }
            case 'css': {
                let entry = this.settings.cssEntry;
                let exist = fse.pathExistsSync(entry);
                if (!exist) {
                    timedLog('Entry file', chalk.cyan(entry), 'was not found.', chalk.red('Aborting CSS build.'));
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
     * Runs the selected build task.
     * @param taskName 
     */
    build(taskName: string) {
        if (process.send === undefined) {
            // parent
            this.chat();
            this.startBackgroundTask(taskName);
        } else {
            let task: Promise<void>;

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
                    throw Error('Task `' + taskName + '` does not exists!');
                }
            }

            // console.log(taskName);
            task.catch(error => {
                timedLog(chalk.red('FATAL ERROR'), 'during', taskName.toUpperCase(), 'build:');
                console.error(error);
                hub.buildDone();
            });
        }
    }

    /**
     * Returns true when package.json exists in project root folder but node_modules folder is missing.
     */
    get needPackageRestore() {
        let hasNodeModules = fse.pathExistsSync(this.settings.npmFolder);
        let hasPackageJson = fse.pathExistsSync(this.settings.packageJson);

        let restore = hasPackageJson && !hasNodeModules;
        if (restore) {
            timedLog(chalk.cyan('node_modules'), 'folder not found. Performing automatic package restore...');
        }

        return restore;
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
        let w = '';
        if (this.flags.watch) {
            w = chalk.grey('(runs once / not watching)');
        }

        timedLog('Resolving', chalk.cyan(this.settings.concatCount.toString()), 'concat target(s)...', w);

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
