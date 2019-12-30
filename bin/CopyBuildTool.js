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
const Shout_1 = require("./Shout");
const VoiceAssistant_1 = require("./VoiceAssistant");
const PrettyUnits_1 = require("./PrettyUnits");
const chalk = require("chalk");
const upath = require("upath");
const fse = require("fs-extra");
const PathFinder_1 = require("./variables-factory/PathFinder");
const FastGlob = require("fast-glob");
class CopyBuildTool {
    constructor(variables) {
        this.variables = variables;
        this.va = new VoiceAssistant_1.VoiceAssistant(variables.mute);
        this.pathFinder = new PathFinder_1.PathFinder(variables);
    }
    buildWithStopwatch() {
        return __awaiter(this, void 0, void 0, function* () {
            let message = `Copying ${this.variables.copy.length} library assets ${chalk.grey('to ' + this.pathFinder.outputFolderPath)}`;
            const overwriteMode = true;
            if (overwriteMode) {
                message += chalk.yellow(' (non-overwrite)');
            }
            Shout_1.Shout.timed(message);
            const start = process.hrtime();
            try {
                const count = yield this.build();
                Shout_1.Shout.timed(`Copy Assets job: Successfully copied ${count} files`);
            }
            catch (error) {
                this.va.speak('COPY ASSETS ERROR!');
                Shout_1.Shout.error('during Copy Assets job:', error);
            }
            finally {
                const time = PrettyUnits_1.prettyHrTime(process.hrtime(start));
                Shout_1.Shout.timed('Finished Copy Assets job after', chalk.green(time));
            }
        });
    }
    tryCopyFile(from, to, overwrite) {
        return __awaiter(this, void 0, void 0, function* () {
            const exists = yield fse.pathExists(to);
            if (exists && overwrite === false) {
                return false;
            }
            const targetFolderPath = upath.dirname(to);
            try {
                yield fse.ensureDir(targetFolderPath);
            }
            catch (err) {
                Shout_1.Shout.error(`Failed to copy file: Error when creating folder: ${targetFolderPath}`, err);
                return false;
            }
            try {
                if (overwrite) {
                    yield fse.copyFile(from, to);
                }
                else {
                    yield fse.copyFile(from, to, fse.constants.COPYFILE_EXCL);
                }
                return true;
            }
            catch (err) {
                Shout_1.Shout.error(`Failed to copy file to: ${to}`, err);
                return false;
            }
        });
    }
    scanStringMatrixVerticalEquality(matrix, column, value) {
        for (const list of matrix) {
            if (list[column] !== value) {
                return false;
            }
        }
        return true;
    }
    findCommonParentFolderPath(files) {
        if (!files[0]) {
            return '';
        }
        const tokenMatrix = files.map(Q => Q.split('/'));
        const commonPath = [];
        let i = 0;
        do {
            const sample = tokenMatrix[0][i];
            if (!sample) {
                break;
            }
            const match = this.scanStringMatrixVerticalEquality(tokenMatrix, i, sample);
            if (match === false) {
                break;
            }
            commonPath.push(sample);
            i++;
        } while (tokenMatrix[0][i]);
        return upath.join(...commonPath);
    }
    tryCopy(job, overwrite) {
        return __awaiter(this, void 0, void 0, function* () {
            const libraryPath = upath.join(this.pathFinder.npmFolder, job.library);
            const targetPath = upath.join(this.pathFinder.outputFolderPath, job.destination);
            const tasks = [];
            const globs = [];
            for (const file of job.files) {
                const absoluteFilePath = upath.join(libraryPath, file);
                const relativeFilePath = upath.relative(libraryPath, absoluteFilePath);
                if (relativeFilePath.startsWith('../')) {
                    Shout_1.Shout.warning(`Copy skip: ${chalk.cyan(file)} is outside library ${chalk.cyan(job.library)} folder!`);
                    continue;
                }
                try {
                    const fileStats = yield fse.lstat(absoluteFilePath);
                    if (fileStats.isFile()) {
                        globs.push(FastGlob.escapePath(relativeFilePath));
                    }
                    else if (fileStats.isDirectory()) {
                        const globbedPath = upath.join(FastGlob.escapePath(relativeFilePath), '**');
                        globs.push(globbedPath);
                    }
                    else {
                        Shout_1.Shout.warning(`Copy skip: ${absoluteFilePath} is neither a file nor a folder?!`);
                    }
                }
                catch (e) {
                    if (FastGlob.isDynamicPattern(relativeFilePath)) {
                        globs.push(relativeFilePath);
                    }
                }
            }
            const assets = yield FastGlob(globs, {
                cwd: libraryPath
            });
            const commonPath = this.findCommonParentFolderPath(assets);
            for (const asset of assets) {
                const absoluteFilePath = upath.join(libraryPath, asset);
                const relativeFilePath = upath.relative(commonPath, asset);
                const targetFilePath = upath.join(targetPath, relativeFilePath);
                const task = this.tryCopyFile(absoluteFilePath, targetFilePath, overwrite);
                tasks.push(task);
            }
            const success = yield Promise.all(tasks);
            return success.filter(Q => Q).length;
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            const packageJson = yield fse.readJson(this.pathFinder.packageJson);
            const dependencies = new Set();
            if (packageJson.dependencies) {
                for (const dependency in packageJson.dependencies) {
                    dependencies.add(dependency);
                }
            }
            if (packageJson.devDependencies) {
                for (const dependency in packageJson.devDependencies) {
                    dependencies.add(dependency);
                }
            }
            const copyTasks = [];
            for (const job of this.variables.copy) {
                if (dependencies.has(job.library)) {
                    copyTasks.push(this.tryCopy(job, false));
                }
                else {
                    Shout_1.Shout.error(`Copy skip: Project package.json has no ${chalk.cyan(job.library)} dependency!`);
                }
            }
            const success = yield Promise.all(copyTasks);
            let count = 0;
            for (const n of success) {
                count += n;
            }
            return count;
        });
    }
}
exports.CopyBuildTool = CopyBuildTool;
