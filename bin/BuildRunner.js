"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildRunner = void 0;
const fse = require("fs-extra");
const chalk = require("chalk");
const Shout_1 = require("./Shout");
const PathFinder_1 = require("./variables-factory/PathFinder");
const BuildWorkerManager_1 = require("./BuildWorkerManager");
class BuildRunner {
    constructor(variables) {
        this.variables = variables;
        this.finder = new PathFinder_1.PathFinder(this.variables);
        this.buildWorker = new BuildWorkerManager_1.BuildWorkerManager();
    }
    outputBuildInformation() {
        if (this.variables.reactRefresh) {
            Shout_1.Shout.warning(`Experimental ${chalk.yellow('React Fast Refresh')} dev server is enabled!`);
        }
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
        if (this.variables.production) {
            smState = smState + ' ' + chalk.grey('(Hidden)');
        }
        else if (this.variables.watch) {
            smState = smState + ' ' + chalk.grey('(Inlined, Eval)');
        }
        Shout_1.Shout.timed('Source Maps:', smState);
        if (this.variables.stats) {
            Shout_1.Shout.timed('JS build stats:', chalk.cyan(this.finder.statsJsonFilePath));
        }
    }
    async validateJsBuildTask() {
        const entry = this.finder.jsEntry;
        const checkEntry = fse.pathExists(entry);
        if (await checkEntry === false) {
            Shout_1.Shout.timed('Entry file', chalk.cyan(entry), 'was not found.', chalk.red('Aborting JS build!'));
            return false;
        }
        return true;
    }
    async validateCssBuildTask() {
        const entry = this.finder.cssEntry;
        const exist = await fse.pathExists(entry);
        if (!exist) {
            Shout_1.Shout.timed('Entry file', chalk.cyan(entry), 'was not found.', chalk.red('Aborting CSS build!'));
        }
        return exist;
    }
    build(taskName) {
        if (taskName === 'all') {
            this.build('js');
            this.build('css');
            this.build('copy');
        }
        else if (taskName === 'js') {
            const valid = this.validateJsBuildTask();
            if (valid) {
                this.buildWorker.runJsBuildWorker(this.variables);
                this.buildWorker.runTypeCheckBuildWorker(this.variables);
            }
        }
        else if (taskName === 'css') {
            const valid = this.validateCssBuildTask();
            if (valid) {
                this.buildWorker.runCssBuildWorker(this.variables);
            }
        }
        else if (taskName === 'copy') {
            if (this.variables.copy.length) {
                this.buildWorker.runCopyBuildWorker(this.variables);
            }
        }
        else {
            throw new Error(`Unknown build name: ${taskName}`);
        }
    }
}
exports.BuildRunner = BuildRunner;
