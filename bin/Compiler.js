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
const chokidar = require("chokidar");
const upath = require("upath");
const assert = require("assert");
const child_process_1 = require("child_process");
const EventHub_1 = require("./EventHub");
const TypeScriptBuildTool_1 = require("./TypeScriptBuildTool");
const TypeScriptCheckerTool_1 = require("./TypeScriptCheckerTool");
const SassBuildTool_1 = require("./SassBuildTool");
const ConcatBuildTool_1 = require("./ConcatBuildTool");
const Settings_1 = require("./Settings");
const Shout_1 = require("./Shout");
class Compiler {
    constructor(settings, flags) {
        this.buildTasks = [];
        this.settings = settings;
        this.flags = flags;
    }
    static fromCommand(command) {
        let settings = new Settings_1.Settings(command.root, command.settings);
        let compiler = new Compiler(settings, command.flags);
        return compiler;
    }
    chat() {
        Shout_1.Shout.timed('Output to folder', chalk_1.default.cyan(this.settings.outputFolder));
        if (this.flags.production) {
            Shout_1.Shout.timed(chalk_1.default.yellow("Production"), "Mode: Outputs will be minified.", chalk_1.default.red("(Slow build)"));
        }
        else {
            Shout_1.Shout.timed(chalk_1.default.yellow("Development"), "Mode: Outputs will", chalk_1.default.red("NOT be minified!"), "(Fast build)");
            Shout_1.Shout.timed(chalk_1.default.red("Do not forget to minify"), "before pushing to repository or production server!");
        }
        if (this.flags.watch) {
            Shout_1.Shout.timed(chalk_1.default.yellow("Watch"), "Mode: Source codes will be automatically compiled on changes.");
        }
        if (!this.flags.production || this.flags.watch) {
            this.flags.stats = false;
        }
        Shout_1.Shout.timed('Source Maps:', chalk_1.default.yellow(this.flags.sourceMap ? 'Enabled' : 'Disabled'));
        if (this.flags.stats) {
            Shout_1.Shout.timed('JS build stats:', chalk_1.default.cyan(this.settings.statJsonPath));
        }
    }
    startBackgroundTask(taskName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (taskName === 'all') {
                let t1 = this.startBackgroundTask('js');
                let t2 = this.startBackgroundTask('css');
                let t3 = this.startBackgroundTask('concat');
                yield Promise.all([t1, t2, t3]);
                return;
            }
            let valid = yield this.validateBackgroundTask(taskName);
            if (!valid) {
                return;
            }
            let child = child_process_1.fork(__filename);
            child.send({
                build: taskName,
                root: this.settings.root,
                flags: this.flags,
                settings: this.settings.core
            });
            this.buildTasks.push(child);
            if (taskName === 'js') {
                yield this.startBackgroundTask('type-checker');
            }
        });
    }
    validateBackgroundTask(taskName) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (taskName) {
                case 'js': {
                    let entry = this.settings.jsEntry;
                    let tsconfig = this.settings.tsConfigJson;
                    let checkEntry = fse.pathExists(entry);
                    let checkProject = fse.pathExists(tsconfig);
                    if ((yield checkEntry) === false) {
                        Shout_1.Shout.timed('Entry file', chalk_1.default.cyan(entry), 'was not found.', chalk_1.default.red('Aborting JS build!'));
                        return false;
                    }
                    if ((yield checkProject) === false) {
                        Shout_1.Shout.timed('Project file', chalk_1.default.cyan(tsconfig), 'was not found.', chalk_1.default.red('Aborting JS build!'));
                        return false;
                    }
                    return true;
                }
                case 'css': {
                    let entry = this.settings.cssEntry;
                    let exist = yield fse.pathExists(entry);
                    if (!exist) {
                        Shout_1.Shout.timed('Entry file', chalk_1.default.cyan(entry), 'was not found.', chalk_1.default.red('Aborting CSS build!'));
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
        });
    }
    killAllBuilds() {
        for (let task of this.buildTasks) {
            task.kill();
        }
        this.buildTasks = [];
    }
    deepEqual(a, b) {
        try {
            assert.deepStrictEqual(a, b);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    restartBuildsOnConfigurationChanges(taskName) {
        let snapshots = {
            [this.settings.packageJson]: fse.readJsonSync(this.settings.packageJson),
            [this.settings.tsConfigJson]: fse.readJsonSync(this.settings.tsConfigJson),
        };
        let debounced;
        let debounce = (file) => {
            clearTimeout(debounced);
            debounced = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                let snap = yield fse.readJson(file);
                if (this.deepEqual(snapshots[file], snap)) {
                    return;
                }
                snapshots[file] = snap;
                Shout_1.Shout.timed(chalk_1.default.cyan(file), 'was edited. Restarting builds...');
                this.killAllBuilds();
                this.settings = yield Settings_1.Settings.tryReadFromPackageJson(this.settings.root);
                this.build(taskName, false);
            }), 500);
        };
        chokidar.watch([this.settings.packageJson, this.settings.tsConfigJson], {
            ignoreInitial: true
        })
            .on('change', (file) => {
            file = upath.toUnix(file);
            debounce(file);
        })
            .on('unlink', (file) => {
            file = upath.toUnix(file);
            snapshots[file] = null;
            Shout_1.Shout.danger(chalk_1.default.cyan(file), 'was deleted!');
        });
    }
    build(taskName, initial = true) {
        let task;
        if (process.send === undefined) {
            if (initial) {
                this.chat();
                if (this.flags.watch) {
                    this.restartBuildsOnConfigurationChanges(taskName);
                }
            }
            task = this.startBackgroundTask(taskName);
        }
        else {
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
        }
        task.catch(error => {
            Shout_1.Shout.fatal(`during ${taskName.toUpperCase()} build:`, error);
            EventHub_1.default.buildDone();
        });
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
            Shout_1.Shout.timed('Resolving', chalk_1.default.green(this.settings.concatCount.toString()), 'concat target(s)...');
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
