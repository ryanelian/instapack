"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fse = require("fs-extra");
const chalk = require("chalk");
const Shout_1 = require("./Shout");
const PathFinder_1 = require("./variables-factory/PathFinder");
const RunWorker_1 = require("./workers/RunWorker");
const VoiceAssistant_1 = require("./VoiceAssistant");
class ToolOrchestrator {
    constructor(variables) {
        this.variables = variables;
        this.finder = new PathFinder_1.PathFinder(this.variables);
    }
    outputBuildInformation() {
        if (this.variables.production) {
            Shout_1.Shout.timed(chalk.yellow("Production"), "Mode: Build optimizations are enabled.");
        }
        else {
            Shout_1.Shout.timed(chalk.yellow("Development"), "Mode: Build optimizations are", chalk.red("DISABLED!"), chalk.grey("(Fast build)"));
        }
        if (this.variables.watch) {
            Shout_1.Shout.timed(chalk.yellow("Watch"), "Mode: Source code will be automatically compiled on changes.");
        }
        let smState = chalk.yellow(this.variables.sourceMap ? 'Enabled' : 'Disabled');
        if (!this.variables.production && this.variables.watch) {
            smState = smState + ' ' + chalk.grey('(Inlined JS)');
        }
        Shout_1.Shout.timed('Source Maps:', smState);
        if (this.variables.stats) {
            Shout_1.Shout.timed('JS build stats:', chalk.cyan(this.finder.statsJsonFilePath));
        }
    }
    validateJsBuildTask() {
        return __awaiter(this, void 0, void 0, function* () {
            const entry = this.finder.jsEntry;
            const checkEntry = fse.pathExists(entry);
            if ((yield checkEntry) === false) {
                Shout_1.Shout.timed('Entry file', chalk.cyan(entry), 'was not found.', chalk.red('Aborting JS build!'));
                return false;
            }
            return true;
        });
    }
    validateCssBuildTask() {
        return __awaiter(this, void 0, void 0, function* () {
            const entry = this.finder.cssEntry;
            const exist = yield fse.pathExists(entry);
            if (!exist) {
                Shout_1.Shout.timed('Entry file', chalk.cyan(entry), 'was not found.', chalk.red('Aborting CSS build!'));
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
                    this.build('copy');
                    return;
                case 'js': {
                    const valid = yield this.validateJsBuildTask();
                    if (valid) {
                        RunWorker_1.runTypeScriptBuildWorker(this.variables).catch(error => {
                            Shout_1.Shout.fatal(`during JS build:`, error);
                            const va = new VoiceAssistant_1.VoiceAssistant(this.variables.mute);
                            va.speak(`JAVASCRIPT BUILD FATAL ERROR!`);
                        });
                        RunWorker_1.runTypeScriptCheckWorker(this.variables).catch(error => {
                            Shout_1.Shout.fatal(`during type-checking:`, error);
                            const va = new VoiceAssistant_1.VoiceAssistant(this.variables.mute);
                            va.speak(`TYPE CHECK FATAL ERROR!`);
                        });
                    }
                    return;
                }
                case 'css': {
                    const valid = yield this.validateCssBuildTask();
                    if (valid) {
                        RunWorker_1.runSassBuildWorker(this.variables).catch(error => {
                            Shout_1.Shout.fatal(`during CSS build:`, error);
                            const va = new VoiceAssistant_1.VoiceAssistant(this.variables.mute);
                            va.speak(`CSS BUILD FATAL ERROR!`);
                        });
                    }
                    return;
                }
                case 'copy': {
                    if (this.variables.copy.length) {
                        RunWorker_1.runCopyBuildWorker(this.variables).catch(error => {
                            Shout_1.Shout.fatal(`during Copy Assets job:`, error);
                            const va = new VoiceAssistant_1.VoiceAssistant(this.variables.mute);
                            va.speak(`COPY ASSETS FATAL ERROR!`);
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
