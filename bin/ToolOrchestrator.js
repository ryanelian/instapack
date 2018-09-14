"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const Shout_1 = require("./Shout");
const PathFinder_1 = require("./PathFinder");
const WorkerRunner_1 = require("./WorkerRunner");
class ToolOrchestrator {
    constructor(variables) {
        this.variables = variables;
        this.finder = new PathFinder_1.PathFinder(this.variables);
    }
    outputBuildInformation() {
        if (this.variables.watch) {
            Shout_1.Shout.timed(chalk_1.default.yellow("Watch"), "Mode: Source code will be automatically compiled on changes.");
        }
        if (this.variables.production) {
            Shout_1.Shout.timed(chalk_1.default.yellow("Production"), "Mode: Outputs minification is enabled.", chalk_1.default.red("(Slow build)"));
        }
        else {
            Shout_1.Shout.timed(chalk_1.default.yellow("Development"), "Mode: Outputs minification", chalk_1.default.red("is disabled!"), chalk_1.default.grey("(Fast build)"));
            Shout_1.Shout.timed(chalk_1.default.red("REMEMBER TO MINIFY"), "before pushing to production server!");
        }
        Shout_1.Shout.timed('Source Maps:', chalk_1.default.yellow(this.variables.sourceMap ? 'Enabled' : 'Disabled'));
        if (this.variables.stats) {
            Shout_1.Shout.timed('JS build stats:', chalk_1.default.cyan(this.finder.statsJsonFilePath));
        }
    }
    validateJsBuildTask() {
        return __awaiter(this, void 0, void 0, function* () {
            let entry = this.finder.jsEntry;
            let tsconfig = this.finder.tsConfigJson;
            let checkEntry = fs_extra_1.default.pathExists(entry);
            let checkProject = fs_extra_1.default.pathExists(tsconfig);
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
            let entry = this.finder.cssEntry;
            let exist = yield fs_extra_1.default.pathExists(entry);
            if (!exist) {
                Shout_1.Shout.timed('Entry file', chalk_1.default.cyan(entry), 'was not found.', chalk_1.default.red('Aborting CSS build!'));
            }
            return exist;
        });
    }
    build(taskName) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (taskName) {
                case 'all':
                    this.build('js');
                    this.build('css');
                    return;
                case 'js': {
                    let valid = yield this.validateJsBuildTask();
                    if (valid) {
                        WorkerRunner_1.runTypeScriptBuildWorkerAsync(this.variables).catch(error => {
                            Shout_1.Shout.fatal(`during JS build:`, error);
                            Shout_1.Shout.notify(`FATAL ERROR during JS build!`);
                        });
                        WorkerRunner_1.runTypeScriptCheckWorkerAsync(this.variables).catch(error => {
                            Shout_1.Shout.fatal(`during type-checking:`, error);
                            Shout_1.Shout.notify(`FATAL ERROR during type-checking!`);
                        });
                    }
                    return;
                }
                case 'css': {
                    let valid = yield this.validateCssBuildTask();
                    if (valid) {
                        WorkerRunner_1.runSassBuildWorkerAsync(this.variables).catch(error => {
                            Shout_1.Shout.fatal(`during CSS build:`, error);
                            Shout_1.Shout.notify(`FATAL ERROR during CSS build!`);
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
exports.ToolOrchestrator = ToolOrchestrator;