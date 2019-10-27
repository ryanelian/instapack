import { IVariables } from "./variables-factory/IVariables";
import { Shout } from "./Shout";
import { VoiceAssistant } from "./VoiceAssistant";
import { prettyHrTime } from "./PrettyUnits";
import chalk from "chalk";
import * as upath from 'upath';
import * as fse from 'fs-extra';
import { PathFinder } from "./variables-factory/PathFinder";
import FastGlob = require("fast-glob");
import { ICopyOption } from "./variables-factory/IProjectSettings";

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
        let message = `Copying assets from ${this.variables.copy.length} libraries ${chalk.grey('to ' + this.pathFinder.outputFolderPath)}`;
        if (true) {
            message += chalk.yellow(' (non-overwrite)');
        }
        Shout.timed(message);
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
        let exists = await fse.pathExists(to);
        if (exists && overwrite === false) {
            return false;
        }

        let targetFolderPath = upath.dirname(to);
        try {
            await fse.ensureDir(targetFolderPath);
        } catch (err) {
            Shout.error(`Failed to copy file: Error when creating folder: ${targetFolderPath}`, err);
            return false;
        }

        try {
            if (overwrite) {
                await fse.copyFile(from, to);
            } else {
                // just to be really safe... will crash if file existed!
                await fse.copyFile(from, to, fse.constants.COPYFILE_EXCL);
            }
            return true;
        } catch (err) {
            // EPERM: operation not permitted, copyfile 'D:\VS\file.txt' -> 'D:\VS\folder'
            Shout.error(`Failed to copy file to: ${to}`, err);
            return false;
        }
    }

    scanStringMatrixVerticalEquality(matrix: string[][], column: number, value: string): boolean {
        for (let list of matrix) {
            if (list[column] !== value) {
                return false;
            }
        }

        return true;
    }

    findCommonParentFolderPath(files: string[]): string {
        let tokenMatrix = files.map(Q => Q.split('/'));
        // "/a/b/c" --> [a,b,c]

        let commonPath: string[] = [];

        let i = 0;
        do {
            let sample = tokenMatrix[0][i];
            // console.log(sample);
            // [[a,b,c], [d,e,f]] --> 'a' or 'b' or 'c'

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

    async tryCopy(job: ICopyOption, overwrite: boolean): Promise<number> {
        let libraryPath = upath.join(this.pathFinder.npmFolder, job.library);
        let targetPath = upath.join(this.pathFinder.outputFolderPath, job.destination);

        let tasks: Promise<boolean>[] = [];
        let globs: string[] = [];

        for (let file of job.files) {
            let absoluteFilePath = upath.join(libraryPath, file);
            // need to do this to squash folder navigations ('../')
            let relativeFilePath = upath.relative(libraryPath, absoluteFilePath);
            if (relativeFilePath.startsWith('../')) {
                // For example:
                // library path :   /project/node_modules/jquery
                // file         :   ../wtf
                // file path    :   /project/node_modules/wtf
                // valid file path: /project/node_modules/jquery/valid
                Shout.warning(`Copy skip: ${chalk.cyan(file)} is outside library ${chalk.cyan(job.library)} folder!`);
                continue;
            }

            try {
                // there is a small but very real chance that we have glob-like path entered by user...
                // for example: '/project/node_modules/something/(actual_{folder}_[yo])/sad
                // that file or folder must not be treated as glob! (escaped)

                let fileStats = await fse.lstat(absoluteFilePath);
                if (fileStats.isFile()) {
                    let targetFilePath = upath.join(targetPath, file);
                    let task = this.tryCopyFile(absoluteFilePath, targetFilePath, overwrite);
                    tasks.push(task);
                } else if (fileStats.isDirectory()) {
                    let globbedPath = upath.join(FastGlob.escapePath(relativeFilePath), '**');
                    globs.push(globbedPath);
                } else {
                    Shout.warning(`Copy skip: ${absoluteFilePath} is neither a file nor a folder?!`);
                }
            } catch (e) {
                // file or folder does not exist, is probably a glob...
                if (FastGlob.isDynamicPattern(relativeFilePath)) {
                    globs.push(relativeFilePath);
                }
            }
        }

        let assets = await FastGlob(globs, {
            cwd: libraryPath
        }); // folder/something.svg
        let commonPath = this.findCommonParentFolderPath(assets); // folder

        // console.log('COMMON PATH:', commonPath);
        for (let asset of assets) {
            let absoluteFilePath = upath.join(libraryPath, asset); // /project/node_modules/library/folder/something.svg
            let relativeFilePath = upath.relative(commonPath, asset); // something.svg
            let targetFilePath = upath.join(targetPath, relativeFilePath); // /project/wwwroot/target/something.svg
            // console.log(relativeFilePath);
            // console.log(absoluteFilePath);
            // console.log(targetFilePath);
            let task = this.tryCopyFile(absoluteFilePath, targetFilePath, overwrite);
            tasks.push(task)
        }

        let success = await Promise.all(tasks);
        return success.filter(Q => Q).length;
    }

    async build() {
        let packageJson = await fse.readJson(this.pathFinder.packageJson);
        let dependencies = new Set<string>();
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

        let copyTasks: Promise<number>[] = [];
        for (let job of this.variables.copy) {
            if (dependencies.has(job.library)) {
                copyTasks.push(this.tryCopy(job, false));
            } else {
                Shout.error(`Copy skip: Project package.json has no ${chalk.cyan(job.library)} dependency!`);
            }
        }

        let success = await Promise.all(copyTasks);
        let count = 0;
        for (let n of success) {
            count += n;
        }
        return count;
    }
}
