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
class CopyBuildTool {
    constructor(variables) {
        this.variables = variables;
        this.va = new VoiceAssistant_1.VoiceAssistant(variables.silent);
        this.pathFinder = new PathFinder_1.PathFinder(variables);
    }
    buildWithStopwatch() {
        return __awaiter(this, void 0, void 0, function* () {
            Shout_1.Shout.timed(`Copying ${this.variables.copy.length} asset(s) ${chalk_1.default.grey('to ' + this.pathFinder.outputFolderPath)} ${chalk_1.default.yellow('(non-overwrite)')}`);
            let start = process.hrtime();
            try {
                yield this.build();
            }
            catch (error) {
                this.va.speak('COPY TASK ERROR!');
                Shout_1.Shout.error('during Copy build task:', error);
            }
            finally {
                let time = PrettyUnits_1.prettyHrTime(process.hrtime(start));
                Shout_1.Shout.timed('Finished Copy build task after', chalk_1.default.green(time));
            }
        });
    }
    tryCopy(value, overwrite) {
        return __awaiter(this, void 0, void 0, function* () {
            let absolutePath = upath.join(this.pathFinder.npmFolder, value);
            let relativePath = upath.relative(this.pathFinder.npmFolder, absolutePath);
            if (!relativePath) {
                Shout_1.Shout.warning(`Copy skip: copying the entire npm folder is not allowed!`);
                return;
            }
            if (relativePath.startsWith('../')) {
                Shout_1.Shout.warning(`Copy skip: Path ${chalk_1.default.cyan(value)} is outside npm folder!`);
                return;
            }
            let isPathExist = yield fse.pathExists(absolutePath);
            if (isPathExist === false) {
                Shout_1.Shout.warning(`Copy skip: Path ${chalk_1.default.cyan(value)} does not exists!`);
                return;
            }
            let folderOrFileName = upath.basename(absolutePath);
            let targetPath = upath.join(this.pathFinder.outputFolderPath, folderOrFileName);
            yield fse.copy(absolutePath, targetPath, {
                overwrite: overwrite
            });
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            let copyTasks = [];
            for (let value of this.variables.copy) {
                copyTasks.push(this.tryCopy(value, false));
            }
            yield Promise.all(copyTasks);
        });
    }
}
exports.CopyBuildTool = CopyBuildTool;
