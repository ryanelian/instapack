"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fse = require("fs-extra");
const chalk_1 = require("chalk");
const child_process_1 = require("child_process");
const EventHub_1 = require("./EventHub");
const TypeScriptBuildTool_1 = require("./TypeScriptBuildTool");
const TypeScriptCheckerTool_1 = require("./TypeScriptCheckerTool");
const SassBuildTool_1 = require("./SassBuildTool");
const ConcatBuildTool_1 = require("./ConcatBuildTool");
const Settings_1 = require("./Settings");
const CompilerUtilities_1 = require("./CompilerUtilities");
class Compiler {
    constructor(settings, flags) {
        this.settings = settings;
        this.flags = flags;
    }
    static fromCommand(command) {
        let settings = new Settings_1.Settings(command.root, command.settings);
        let compiler = new Compiler(settings, command.flags);
        return compiler;
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
        if (this.flags.watch) {
            CompilerUtilities_1.timedLog(chalk_1.default.yellow("Watch"), "Mode: Source codes will be automatically compiled on changes.");
        }
        if (!this.flags.production || this.flags.watch) {
            this.flags.analyze = false;
        }
        if (this.flags.analyze) {
            let analysisPath = this.settings.outputJsFolder + '/analysis.html';
            CompilerUtilities_1.timedLog(chalk_1.default.yellow('Analyze'), 'Mode:', chalk_1.default.cyan(analysisPath));
        }
        CompilerUtilities_1.timedLog('Source Maps:', chalk_1.default.yellow(this.flags.sourceMap ? 'Enabled' : 'Disabled'));
    }
    startBackgroundTask(taskName) {
        if (taskName === 'all') {
            this.startBackgroundTask('js');
            this.startBackgroundTask('css');
            this.startBackgroundTask('concat');
            return;
        }
        let valid = this.validateBackgroundTask(taskName);
        if (valid) {
            let child = child_process_1.fork(__filename);
            child.send({
                build: taskName,
                root: this.settings.root,
                flags: this.flags,
                settings: this.settings.core
            });
            if (taskName === 'js') {
                this.startBackgroundTask('type-checker');
            }
        }
    }
    validateBackgroundTask(taskName) {
        switch (taskName) {
            case 'js': {
                let entry = this.settings.jsEntry;
                let exist = fse.pathExistsSync(entry);
                if (!exist) {
                    CompilerUtilities_1.timedLog('Entry file', chalk_1.default.cyan(entry), 'was not found.', chalk_1.default.red('Aborting JS build.'));
                }
                return exist;
            }
            case 'css': {
                let entry = this.settings.cssEntry;
                let exist = fse.pathExistsSync(entry);
                if (!exist) {
                    CompilerUtilities_1.timedLog('Entry file', chalk_1.default.cyan(entry), 'was not found.', chalk_1.default.red('Aborting CSS build.'));
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
    build(taskName) {
        if (process.send === undefined) {
            this.chat();
            this.startBackgroundTask(taskName);
        }
        else {
            let task;
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
            task.catch(error => {
                CompilerUtilities_1.timedLog(chalk_1.default.red('FATAL ERROR'), 'during', taskName.toUpperCase(), 'build:');
                console.error(error);
                EventHub_1.default.buildDone();
            });
        }
    }
    get needPackageRestore() {
        let hasNodeModules = fse.pathExistsSync(this.settings.npmFolder);
        let hasPackageJson = fse.pathExistsSync(this.settings.packageJson);
        let restore = hasPackageJson && !hasNodeModules;
        if (restore) {
            CompilerUtilities_1.timedLog(chalk_1.default.cyan('node_modules'), 'folder not found. Performing automatic package restore...');
        }
        return restore;
    }
    buildJS() {
        return __awaiter(this, void 0, void 0, function* () {
            yield fse.remove(this.settings.outputJsSourceMap);
            let tool = new TypeScriptBuildTool_1.TypeScriptBuildTool(this.settings, this.flags);
            tool.build();
        });
    }
    buildCSS() {
        return __awaiter(this, void 0, void 0, function* () {
            yield fse.remove(this.settings.outputCssSourceMap);
            let tool = new SassBuildTool_1.SassBuildTool(this.settings, this.flags);
            yield tool.buildWithStopwatch();
            if (this.flags.watch) {
                tool.watch();
            }
        });
    }
    buildConcat() {
        return __awaiter(this, void 0, void 0, function* () {
            let w = '';
            if (this.flags.watch) {
                w = chalk_1.default.grey('(runs once / not watching)');
            }
            CompilerUtilities_1.timedLog('Resolving', chalk_1.default.cyan(this.settings.concatCount.toString()), 'concat target(s)...', w);
            let tool = new ConcatBuildTool_1.ConcatBuildTool(this.settings, this.flags);
            yield tool.buildWithStopwatch();
        });
    }
    checkTypeScript() {
        return __awaiter(this, void 0, void 0, function* () {
            let tool = new TypeScriptCheckerTool_1.TypeScriptCheckerTool(this.settings);
            tool.typeCheck();
            if (this.flags.watch) {
                tool.watch();
            }
        });
    }
}
exports.Compiler = Compiler;
if (process.send) {
    process.on('message', (command) => {
        if (command.build) {
            if (!command.flags.watch || command.build === 'concat') {
                EventHub_1.default.exitOnBuildDone();
            }
            Compiler.fromCommand(command).build(command.build);
        }
    });
}
