import * as fse from 'fs-extra';
import * as Undertaker from 'undertaker';
import chalk from 'chalk';

import { TypeScriptBuildTool } from './TypeScriptBuildTool';
import { tryGetTypeScriptTarget } from './TypeScriptOptionsReader';
import { SassBuildTool } from './SassBuildTool';
import { ConcatBuildTool } from './ConcatBuildTool';
import { Settings } from './Settings';
import { timedLog, CompilerFlags } from './CompilerUtilities';

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
     * Gets the task registry.
     */
    private readonly tasks: Undertaker;

    /**
     * Constructs a new instance of Compiler using the specified settings and build flags. 
     * @param settings 
     * @param flags 
     */
    constructor(settings: Settings, flags: CompilerFlags) {
        this.settings = settings;
        this.flags = flags;
        this.tasks = new Undertaker();

        this.chat();
        this.registerAllTasks();
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
     * Registers all available tasks and registers a task for invoking all those tasks.
     */
    private registerAllTasks() {
        this.registerConcatTask();
        this.registerJsTask();
        this.registerCssTask();
        this.tasks.task('all', this.tasks.parallel('js', 'css', 'concat'));
    }

    /**
     * Runs the selected build task.
     * @param taskName 
     */
    build(taskName) {
        let run = this.tasks.task(taskName);
        run(error => {
            timedLog(chalk.red('UNHANDLED ERROR'), 'during build:');
            console.error(error);
        });
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
     * Registers a JavaScript build task using TypeScript + webpack.
     */
    private registerJsTask() {
        let jsEntry = this.settings.jsEntry;

        if (!fse.existsSync(jsEntry)) {
            this.tasks.task('js', () => {
                timedLog('Entry file', chalk.cyan(jsEntry), 'was not found.', chalk.red('Aborting JS build.'));
            });
            return;
        }

        let tool = new TypeScriptBuildTool(this.settings, this.flags);
        this.tasks.task('js', () => {
            fse.removeSync(this.settings.outputJsSourceMap);
            timedLog('Compiling JS >', chalk.yellow(tryGetTypeScriptTarget()), chalk.cyan(jsEntry));
            tool.build();
        });
    }

    /**
     * Registers a CSS build task using Sass + postcss.
     */
    private registerCssTask() {
        let cssEntry = this.settings.cssEntry;

        if (!fse.existsSync(cssEntry)) {
            this.tasks.task('css', () => {
                timedLog('Entry file', chalk.cyan(cssEntry), 'was not found.', chalk.red('Aborting CSS build.'));
            });
            return;
        }

        let tool = new SassBuildTool(this.settings, this.flags);
        this.tasks.task('css', () => {
            fse.removeSync(this.settings.outputCssSourceMap);
            timedLog('Compiling CSS', chalk.cyan(cssEntry));
            tool.buildWithStopwatch();

            if (this.flags.watch) {
                tool.watch();
            }
        });
    }

    /**
     * Registers a JavaScript concat task using UglifyES.
     */
    private registerConcatTask() {
        let c = this.settings.concatCount;
        if (c === 0) {
            this.tasks.task('concat', () => { });
            return;
        }

        let tool = new ConcatBuildTool(this.settings, this.flags);
        this.tasks.task('concat', () => {
            if (this.flags.watch) {
                timedLog("Concat task will be run once and", chalk.red("NOT watched!"));
            }

            timedLog('Resolving', chalk.cyan(c.toString()), 'concat target(s)...');
            return tool.buildWithStopwatch();
        });
    }
}
