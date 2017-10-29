"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fse = require("fs-extra");
const Undertaker = require("undertaker");
const chalk_1 = require("chalk");
const TypeScriptBuildTool_1 = require("./TypeScriptBuildTool");
const UglifyESOptions_1 = require("./UglifyESOptions");
const SassBuildTool_1 = require("./SassBuildTool");
const ConcatBuildTool_1 = require("./ConcatBuildTool");
const CompilerUtilities_1 = require("./CompilerUtilities");
class Compiler {
    constructor(settings, flags) {
        this.settings = settings;
        this.flags = flags;
        this.tasks = new Undertaker();
        this.chat();
        this.registerAllTasks();
    }
    chat() {
        CompilerUtilities_1.timedLog('Output to folder', chalk_1.default.cyan(this.settings.outputFolder));
        if (this.flags.production) {
            CompilerUtilities_1.timedLog(chalk_1.default.yellow("Production"), "Mode: Outputs will be minified.", chalk_1.default.red("(Slow build)"));
        }
        else {
            CompilerUtilities_1.timedLog(chalk_1.default.yellow("Development"), "Mode: Outputs will", chalk_1.default.red("NOT be minified!"), "(Fast build)");
            CompilerUtilities_1.timedLog(chalk_1.default.red("Do not forget to minify"), "before pushing to repository or production server!");
        }
        if (this.flags.parallel) {
            CompilerUtilities_1.timedLog(chalk_1.default.yellow('Parallel'), 'Mode: Build will be scaled across all CPU threads!');
        }
        if (this.flags.watch) {
            CompilerUtilities_1.timedLog(chalk_1.default.yellow("Watch"), "Mode: Source codes will be automatically compiled on changes.");
        }
        CompilerUtilities_1.timedLog('Source Maps:', chalk_1.default.yellow(this.flags.sourceMap ? 'Enabled' : 'Disabled'));
    }
    registerAllTasks() {
        this.registerConcatTask();
        this.registerJsTask();
        this.registerCssTask();
        this.tasks.task('all', this.tasks.parallel('js', 'css', 'concat'));
    }
    build(taskName) {
        let run = this.tasks.task(taskName);
        run(error => {
            CompilerUtilities_1.timedLog(chalk_1.default.red('UNHANDLED ERROR'), 'during build:');
            console.error(error);
        });
    }
    get needPackageRestore() {
        let hasNodeModules = fse.existsSync(this.settings.npmFolder);
        let hasPackageJson = fse.existsSync(this.settings.packageJson);
        let restore = hasPackageJson && !hasNodeModules;
        if (restore) {
            CompilerUtilities_1.timedLog(chalk_1.default.cyan('node_modules'), 'folder not found. Performing automatic package restore...');
        }
        return restore;
    }
    registerJsTask() {
        let jsEntry = this.settings.jsEntry;
        if (!fse.existsSync(jsEntry)) {
            this.tasks.task('js', () => {
                CompilerUtilities_1.timedLog('Entry file', chalk_1.default.cyan(jsEntry), 'was not found.', chalk_1.default.red('Aborting JS build.'));
            });
            return;
        }
        let tool = new TypeScriptBuildTool_1.TypeScriptBuildTool(this.settings, this.flags);
        this.tasks.task('js', () => {
            fse.removeSync(this.settings.outputJsSourceMap);
            CompilerUtilities_1.timedLog('Compiling JS >', chalk_1.default.yellow(UglifyESOptions_1.tryGetTypeScriptTarget()), chalk_1.default.cyan(jsEntry));
            tool.build();
        });
    }
    registerCssTask() {
        let cssEntry = this.settings.cssEntry;
        if (!fse.existsSync(cssEntry)) {
            this.tasks.task('css', () => {
                CompilerUtilities_1.timedLog('Entry file', chalk_1.default.cyan(cssEntry), 'was not found.', chalk_1.default.red('Aborting CSS build.'));
            });
            return;
        }
        let tool = new SassBuildTool_1.SassBuildTool(this.settings, this.flags);
        this.tasks.task('css', () => {
            fse.removeSync(this.settings.outputCssSourceMap);
            CompilerUtilities_1.timedLog('Compiling CSS', chalk_1.default.cyan(cssEntry));
            tool.buildWithStopwatch();
            if (this.flags.watch) {
                tool.watch();
            }
        });
    }
    registerConcatTask() {
        let c = this.settings.concatCount;
        if (c === 0) {
            this.tasks.task('concat', () => { });
            return;
        }
        let tool = new ConcatBuildTool_1.ConcatBuildTool(this.settings, this.flags);
        this.tasks.task('concat', () => {
            if (this.flags.watch) {
                CompilerUtilities_1.timedLog("Concat task will be run once and", chalk_1.default.red("NOT watched!"));
            }
            CompilerUtilities_1.timedLog('Resolving', chalk_1.default.cyan(c.toString()), 'concat target(s)...');
            return tool.buildWithStopwatch();
        });
    }
}
exports.Compiler = Compiler;
