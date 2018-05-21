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
const Shout_1 = require("./Shout");
const CompilerUtilities_1 = require("./CompilerUtilities");
const typeScriptBuildWorkerModulePath = require.resolve('./build-workers/TypeScriptBuildWorker');
const typeScriptCheckWorkerModulePath = require.resolve('./build-workers/TypeScriptCheckWorker');
const sassBuildWorkerModulePath = require.resolve('./build-workers/SassBuildWorker');
const concatBuildWorkerModulePath = require.resolve('./build-workers/ConcatBuildWorker');
class Compiler {
    constructor(settings, flags) {
        this.settings = settings;
        this.flags = flags;
    }
    chat() {
        if (this.flags.watch) {
            Shout_1.Shout.timed(chalk_1.default.yellow("Watch"), "Mode: Source code will be automatically compiled on changes.");
        }
        if (this.flags.production) {
            Shout_1.Shout.timed(chalk_1.default.yellow("Production"), "Mode: Outputs minification is enabled.", chalk_1.default.red("(Slow build)"));
        }
        else {
            Shout_1.Shout.timed(chalk_1.default.yellow("Development"), "Mode: Outputs minification", chalk_1.default.red("is disabled!"), chalk_1.default.grey("(Fast build)"));
            Shout_1.Shout.timed(chalk_1.default.red("REMEMBER TO MINIFY"), "before pushing to production server!");
        }
        if (!this.flags.production || this.flags.watch) {
            this.flags.stats = false;
        }
        Shout_1.Shout.timed('Source Maps:', chalk_1.default.yellow(this.flags.sourceMap ? 'Enabled' : 'Disabled'));
        if (this.flags.stats) {
            Shout_1.Shout.timed('JS build stats:', chalk_1.default.cyan(this.settings.statJsonPath));
        }
    }
    validateJsBuildTask() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    validateCssBuildTask() {
        return __awaiter(this, void 0, void 0, function* () {
            let entry = this.settings.cssEntry;
            let exist = yield fse.pathExists(entry);
            if (!exist) {
                Shout_1.Shout.timed('Entry file', chalk_1.default.cyan(entry), 'was not found.', chalk_1.default.red('Aborting CSS build!'));
            }
            return exist;
        });
    }
    build(taskName) {
        this.chat();
        this.runBuildWorkerForTask(taskName);
    }
    get buildCommand() {
        return {
            root: this.settings.root,
            flags: this.flags,
            settings: this.settings.core
        };
    }
    ;
    runBuildWorkerForTask(taskName) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (taskName) {
                case 'all':
                    this.runBuildWorkerForTask('js');
                    this.runBuildWorkerForTask('css');
                    this.runBuildWorkerForTask('concat');
                    return;
                case 'js': {
                    let valid = yield this.validateJsBuildTask();
                    if (valid) {
                        CompilerUtilities_1.runWorkerAsync(typeScriptBuildWorkerModulePath, this.buildCommand).catch(error => {
                            Shout_1.Shout.fatal(`during JS build:`, error);
                            Shout_1.Shout.notify(`FATAL ERROR during JS build!`);
                        });
                        CompilerUtilities_1.runWorkerAsync(typeScriptCheckWorkerModulePath, this.buildCommand).catch(error => {
                            Shout_1.Shout.fatal(`during type-checking:`, error);
                            Shout_1.Shout.notify(`FATAL ERROR during type-checking!`);
                        });
                    }
                    return;
                }
                case 'css': {
                    let valid = yield this.validateCssBuildTask();
                    if (valid) {
                        CompilerUtilities_1.runWorkerAsync(sassBuildWorkerModulePath, this.buildCommand).catch(error => {
                            Shout_1.Shout.fatal(`during CSS build:`, error);
                            Shout_1.Shout.notify(`FATAL ERROR during CSS build!`);
                        });
                    }
                    return;
                }
                case 'concat': {
                    let valid = (this.settings.concatCount > 0);
                    if (valid) {
                        CompilerUtilities_1.runWorkerAsync(concatBuildWorkerModulePath, this.buildCommand).catch(error => {
                            Shout_1.Shout.fatal(`during JS concat:`, error);
                            Shout_1.Shout.notify(`FATAL ERROR during JS concat!`);
                        });
                    }
                    return;
                }
                default:
                    throw Error('Task `' + taskName + '` does not exists!');
            }
        });
    }
}
exports.Compiler = Compiler;
