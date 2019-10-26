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
            let copyCount = Object.keys(this.variables.copy).length;
            Shout_1.Shout.timed(`Copying ${copyCount} Assets ${chalk_1.default.grey('to ' + this.pathFinder.outputFolderPath)} ${chalk_1.default.yellow('(non-overwrite)')}`);
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
            let existing = yield fse.pathExists(to);
            if (existing) {
                let toStats = yield fse.lstat(to);
                if (toStats.isDirectory()) {
                    Shout_1.Shout.error(`Failed to copy file: Destination ${chalk_1.default.cyan(to)} is a directory!`);
                    return false;
                }
                if (overwrite === false) {
                    return false;
                }
            }
            let targetFolderPath = upath.dirname(to);
            try {
                yield fse.ensureDir(targetFolderPath);
            }
            catch (err) {
                Shout_1.Shout.error(`Failed to copy file: Error when creating folder: ${targetFolderPath}`, err);
                return false;
            }
            if (overwrite) {
                yield fse.copyFile(from, to);
            }
            else {
                yield fse.copyFile(from, to, fse.constants.COPYFILE_EXCL);
            }
            return true;
        });
    }
    tryCopy(value, target, overwrite) {
        return __awaiter(this, void 0, void 0, function* () {
            let absolutePath = upath.join(this.pathFinder.npmFolder, value);
            let relativePath = upath.relative(this.pathFinder.npmFolder, absolutePath);
            if (!relativePath) {
                Shout_1.Shout.warning(`Copy skip: copying the entire npm folder is not allowed!`);
                return 0;
            }
            if (relativePath.startsWith('../')) {
                Shout_1.Shout.warning(`Copy skip: Path for ${chalk_1.default.cyan(value)} is outside npm folder!`);
                return 0;
            }
            let isPathExists = yield fse.pathExists(absolutePath);
            if (isPathExists === false) {
                Shout_1.Shout.warning(`Copy skip: Path for ${chalk_1.default.cyan(value)} does not exists!`);
                return 0;
            }
            let stats = yield fse.lstat(absolutePath);
            let targetPath = upath.join(this.pathFinder.outputFolderPath, target);
            if (stats.isDirectory()) {
                let globPath = upath.join(absolutePath, '**');
                let files = yield FastGlob(globPath);
                let copyTasks = files.map(Q => {
                    let relativeFilePath = upath.relative(absolutePath, Q);
                    let targetFilePath = upath.join(targetPath, relativeFilePath);
                    return this.tryCopyFile(Q, targetFilePath, overwrite);
                });
                let finish = yield Promise.all(copyTasks);
                return finish.filter(Q => Q).length;
            }
            else if (stats.isFile()) {
                yield this.tryCopyFile(absolutePath, targetPath, overwrite);
                return 1;
            }
            else {
                Shout_1.Shout.warning(`Copy skip: Path for ${chalk_1.default.cyan(value)} is neither a folder nor a file?!`);
                return 0;
            }
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            let copyTasks = [];
            for (let value in this.variables.copy) {
                let copyTo = this.variables.copy[value];
                copyTasks.push(this.tryCopy(value, copyTo, false));
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
