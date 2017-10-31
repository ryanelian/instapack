import * as fse from 'fs-extra';
import chalk from 'chalk';
import { fork } from 'child_process';

import hub from './EventHub';
import { TypeScriptBuildTool } from './TypeScriptBuildTool';
import { getTypeScriptTarget } from './TypeScriptConfigurationReader';
import { SassBuildTool } from './SassBuildTool';
import { ConcatBuildTool } from './ConcatBuildTool';
import { Settings, SettingsCore } from './Settings';
import { timedLog, CompilerFlags } from './CompilerUtilities';

/**
 * Represents POJO serializable build metadata for child Compiler process.
 */
interface BuildCommand {
    build: string;
    root: string;
    settings: SettingsCore;
    flags: CompilerFlags;
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
    private readonly flags: CompilerFlags;

    /**
     * Constructs a new instance of Compiler using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(settings: Settings, flags: CompilerFlags) {
        this.settings = settings;
        this.flags = flags;
    }

    /**
     * Constructs Compiler instance from child process build command.
     * @param command 
     */
    static fromCommand(command: BuildCommand) {
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

        if (this.flags.parallel) {
            timedLog(chalk.yellow('Parallel'), 'Mode: Build will be scaled across all CPU threads!');
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
            } as BuildCommand);
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
            default: {
                throw Error('Task `' + taskName + '` does not exists!');
            }
        }
    }

    /**
     * Runs the selected build task.
     * @param taskName 
     */
    build(taskName) {
        if (process.send === undefined) {
            // parent
            this.chat();
            this.startBackgroundTask(taskName);
        } else {
            // child
            switch (taskName) {
                case 'js': {
                    this.buildJS();
                    break;
                }
                case 'css': {
                    this.buildCSS();
                    break;
                }
                case 'concat': {
                    this.buildConcat();
                    break;
                }
                default: {
                    throw Error('Task `' + taskName + '` does not exists!');
                }
            }

            // console.log(taskName);
        }
    }

    /**
     * Returns true when package.json exists in project root folder but node_modules folder is missing.
     */
    get needPackageRestore() {
        let hasNodeModules = fse.existsSync(this.settings.npmFolder);
        let hasPackageJson = fse.existsSync(this.settings.packageJson);

        let restore = hasPackageJson && !hasNodeModules;
        if (restore) {
            timedLog(chalk.cyan('node_modules'), 'folder not found. Performing automatic package restore...');
        }

        return restore;
    }

    /**
     * Compiles the JavaScript project using Compiler settings and build flags. 
     */
    async buildJS() {
        await fse.remove(this.settings.outputJsSourceMap);
        timedLog('Compiling JS >', chalk.yellow(getTypeScriptTarget()), chalk.cyan(this.settings.jsEntry));

        let tool = new TypeScriptBuildTool(this.settings, this.flags);
        tool.build();
    }

    /**
     * Compiles the CSS project using Compiler settings and build flags. 
     */
    async buildCSS() {
        await fse.remove(this.settings.outputCssSourceMap);
        timedLog('Compiling CSS', chalk.cyan(this.settings.cssEntry));

        let tool = new SassBuildTool(this.settings, this.flags);
        await tool.buildWithStopwatch();

        if (this.flags.watch) {
            tool.watch();
        }
        hub.buildDone();
    }

    /**
     * Concat JavaScript files using Compiler settings and build flags. 
     */
    async buildConcat() {
        if (this.flags.watch) {
            timedLog("Concat task will be run once and", chalk.red("NOT watched!"));
        }

        timedLog('Resolving', chalk.cyan(this.settings.concatCount.toString()), 'concat target(s)...');

        let tool = new ConcatBuildTool(this.settings, this.flags);
        await tool.buildWithStopwatch();
        hub.buildDone();
    }
}

if (process.send) { // Child Process
    process.on('message', (command: BuildCommand) => {
        // console.log(command);
        if (command.build) {
            if (!command.flags.watch) {
                hub.exitOnBuildDone();
            }

            Compiler.fromCommand(command).build(command.build);
        }
    });
}
