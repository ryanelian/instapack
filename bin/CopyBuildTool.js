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
const chalk_1 = require("chalk");
const upath = require("upath");
const fse = require("fs-extra");
const PathFinder_1 = require("./variables-factory/PathFinder");
const FastGlob = require("fast-glob");
class CopyBuildTool {
    constructor(variables) {
        this.variables = variables;
        this.va = new VoiceAssistant_1.VoiceAssistant(variables.silent);
        this.pathFinder = new PathFinder_1.PathFinder(variables);
    }
    buildWithStopwatch() {
        return __awaiter(this, void 0, void 0, function* () {
            let message = `Copying ${this.variables.copy.length} library assets ${chalk_1.default.grey('to ' + this.pathFinder.outputFolderPath)}`;
            if (true) {
                message += chalk_1.default.yellow(' (non-overwrite)');
            }
            Shout_1.Shout.timed(message);
            let start = process.hrtime();
            try {
                let count = yield this.build();
                Shout_1.Shout.timed(`Copy Assets job: Successfully copied ${count} files`);
            }
            catch (error) {
                this.va.speak('COPY ASSETS ERROR!');
                Shout_1.Shout.error('during Copy Assets job:', error);
            }
            finally {
                let time = PrettyUnits_1.prettyHrTime(process.hrtime(start));
                Shout_1.Shout.timed('Finished Copy Assets job after', chalk_1.default.green(time));
            }
        });
    }
    tryCopyFile(from, to, overwrite) {
        return __awaiter(this, void 0, void 0, function* () {
            let exists = yield fse.pathExists(to);
            if (exists && overwrite === false) {
                return false;
            }
            let targetFolderPath = upath.dirname(to);
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
        for (let list of matrix) {
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
        let tokenMatrix = files.map(Q => Q.split('/'));
        let commonPath = [];
        let i = 0;
        do {
            let sample = tokenMatrix[0][i];
            if (!sample) {
                break;
            }
            let match = this.scanStringMatrixVerticalEquality(tokenMatrix, i, sample);
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
            let libraryPath = upath.join(this.pathFinder.npmFolder, job.library);
            let targetPath = upath.join(this.pathFinder.outputFolderPath, job.destination);
            let tasks = [];
            let globs = [];
            for (let file of job.files) {
                let absoluteFilePath = upath.join(libraryPath, file);
                let relativeFilePath = upath.relative(libraryPath, absoluteFilePath);
                if (relativeFilePath.startsWith('../')) {
                    Shout_1.Shout.warning(`Copy skip: ${chalk_1.default.cyan(file)} is outside library ${chalk_1.default.cyan(job.library)} folder!`);
                    continue;
                }
                try {
                    let fileStats = yield fse.lstat(absoluteFilePath);
                    if (fileStats.isFile()) {
                        globs.push(FastGlob.escapePath(relativeFilePath));
                    }
                    else if (fileStats.isDirectory()) {
                        let globbedPath = upath.join(FastGlob.escapePath(relativeFilePath), '**');
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
            let assets = yield FastGlob(globs, {
                cwd: libraryPath
            });
            let commonPath = this.findCommonParentFolderPath(assets);
            for (let asset of assets) {
                let absoluteFilePath = upath.join(libraryPath, asset);
                let relativeFilePath = upath.relative(commonPath, asset);
                let targetFilePath = upath.join(targetPath, relativeFilePath);
                let task = this.tryCopyFile(absoluteFilePath, targetFilePath, overwrite);
                tasks.push(task);
            }
            let success = yield Promise.all(tasks);
            return success.filter(Q => Q).length;
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            let packageJson = yield fse.readJson(this.pathFinder.packageJson);
            let dependencies = new Set();
            if (packageJson.dependencies) {
                for (let dependency in packageJson.dependencies) {
                    dependencies.add(dependency);
                }
            }
            if (packageJson.devDependencies) {
                for (let dependency in packageJson.devDependencies) {
                    dependencies.add(dependency);
                }
            }
            let copyTasks = [];
            for (let job of this.variables.copy) {
                if (dependencies.has(job.library)) {
                    copyTasks.push(this.tryCopy(job, false));
                }
                else {
                    Shout_1.Shout.error(`Copy skip: Project package.json has no ${chalk_1.default.cyan(job.library)} dependency!`);
                }
            }
            let success = yield Promise.all(copyTasks);
            let count = 0;
            for (let n of success) {
                count += n;
            }
            return count;
        });
    }
}
exports.CopyBuildTool = CopyBuildTool;
