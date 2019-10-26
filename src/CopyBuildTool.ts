import { IVariables } from "./variables-factory/IVariables";
import { Shout } from "./Shout";
import { VoiceAssistant } from "./VoiceAssistant";
import { prettyHrTime } from "./PrettyUnits";
import chalk from "chalk";
import * as upath from 'upath';
import * as fse from 'fs-extra';
import { PathFinder } from "./variables-factory/PathFinder";
import FastGlob = require("fast-glob");

export class CopyBuildTool {

    variables: IVariables;
    va: VoiceAssistant;
    pathFinder: PathFinder;

    constructor(variables: IVariables) {
        this.variables = variables;
        this.va = new VoiceAssistant(variables.silent);
        this.pathFinder = new PathFinder(variables);
    }

    async buildWithStopwatch() {
        let copyCount = Object.keys(this.variables.copy).length;
        Shout.timed(`Copying ${copyCount} Assets ${chalk.grey('to ' + this.pathFinder.outputFolderPath)} ${chalk.yellow('(non-overwrite)')}`);
        let start = process.hrtime();
        try {
            let count = await this.build();
            Shout.timed(`Copy Assets job: Successfully copied ${count} files`);
        }
        catch (error) {
            this.va.speak('COPY ASSETS ERROR!');
            Shout.error('during Copy Assets job:', error);
        }
        finally {
            let time = prettyHrTime(process.hrtime(start));
            Shout.timed('Finished Copy Assets job after', chalk.green(time));
        }
    }

    async tryCopyFile(from: string, to: string, overwrite: boolean): Promise<boolean> {
        let existing = await fse.pathExists(to);
        if (existing) {
            let toStats = await fse.lstat(to);
            if (toStats.isDirectory()) {
                Shout.error(`Failed to copy file: Destination ${chalk.cyan(to)} is a directory!`);
                return false;
            }
            if (overwrite === false) {
                return false;
            }
        }

        let targetFolderPath = upath.dirname(to);
        try {
            await fse.ensureDir(targetFolderPath);
        } catch (err) {
            Shout.error(`Failed to copy file: Error when creating folder: ${targetFolderPath}`, err);
            return false;
        }

        if (overwrite) {
            await fse.copyFile(from, to);
        } else {
            // just to be completely sure... will crash if file existed!
            await fse.copyFile(from, to, fse.constants.COPYFILE_EXCL);
        }
        return true;
    }

    async tryCopy(value: string, target: string, overwrite: boolean): Promise<number> {
        let absolutePath = upath.join(this.pathFinder.npmFolder, value);
        let relativePath = upath.relative(this.pathFinder.npmFolder, absolutePath);

        if (!relativePath) {
            Shout.warning(`Copy skip: copying the entire npm folder is not allowed!`);
            return 0;
        }

        if (relativePath.startsWith('../')) {
            Shout.warning(`Copy skip: Path for ${chalk.cyan(value)} is outside npm folder!`);
            return 0;
        }

        let isPathExists = await fse.pathExists(absolutePath);
        if (isPathExists === false) {
            Shout.warning(`Copy skip: Path for ${chalk.cyan(value)} does not exists!`);
            return 0;
        }

        let stats = await fse.lstat(absolutePath);
        let targetPath = upath.join(this.pathFinder.outputFolderPath, target);

        if (stats.isDirectory()) {
            let globPath = upath.join(absolutePath, '**');
            let files = await FastGlob(globPath);
            let copyTasks = files.map(Q => {
                // console.log(Q);
                let relativeFilePath = upath.relative(absolutePath, Q);
                // console.log(relativePath);
                let targetFilePath = upath.join(targetPath, relativeFilePath);
                // console.log(targetFilePath);
                return this.tryCopyFile(Q, targetFilePath, overwrite);
            });

            let finish = await Promise.all(copyTasks);
            return finish.filter(Q => Q).length;
        } else if (stats.isFile()) {
            await this.tryCopyFile(absolutePath, targetPath, overwrite);
            return 1;
        } else {
            Shout.warning(`Copy skip: Path for ${chalk.cyan(value)} is neither a folder nor a file?!`);
            return 0;
        }
    }

    async build() {
        let copyTasks: Promise<number>[] = [];
        for (let value in this.variables.copy) {
            let copyTo = this.variables.copy[value];
            copyTasks.push(this.tryCopy(value, copyTo, false));
        }

        let success = await Promise.all(copyTasks);
        let count = 0;
        for (let n of success) {
            count += n;
        }
        return count;
    }
}
