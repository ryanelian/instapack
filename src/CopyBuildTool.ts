import { BuildVariables, CopyOption } from "./variables-factory/BuildVariables";
import { Shout } from "./Shout";
import { VoiceAssistant } from "./VoiceAssistant";
import { prettyHrTime } from "./PrettyUnits";
import chalk = require('chalk');
import * as upath from 'upath';
import * as fse from 'fs-extra';
import { PathFinder } from "./variables-factory/PathFinder";
import FastGlob = require("fast-glob");

export class CopyBuildTool {

    variables: BuildVariables;
    va: VoiceAssistant;
    pathFinder: PathFinder;

    constructor(variables: BuildVariables) {
        this.variables = variables;
        this.va = new VoiceAssistant(variables.mute);
        this.pathFinder = new PathFinder(variables);
    }

    async buildWithStopwatch(): Promise<void> {
        Shout.timed(`Copying ${this.variables.copy.length} library assets ${chalk.grey('to ' + this.pathFinder.outputFolderPath)}`);
        const start = process.hrtime();
        try {
            const count = await this.build();
            let message = `Copy Assets job: Successfully copied ${count} files`;
            if (this.variables.copyOverwrite) {
                message += chalk.yellow(' (overwrites: on)')
            } else {
                message += chalk.grey(' (overwrites: off)');
            }
            Shout.timed(message);
        }
        catch (error) {
            this.va.speak('COPY ASSETS ERROR!');
            Shout.error('during Copy Assets job:', error);
        }
        finally {
            const time = prettyHrTime(process.hrtime(start));
            Shout.timed('Finished Copy Assets job after', chalk.green(time));
        }
    }

    async tryCopyFile(from: string, to: string): Promise<boolean> {
        const exists = await fse.pathExists(to);
        if (exists && !this.variables.copyOverwrite) {
            return false;
        }

        const targetFolderPath = upath.dirname(to);
        try {
            await fse.ensureDir(targetFolderPath);
        } catch (err) {
            Shout.error(`Failed to copy file: Error when creating folder: ${targetFolderPath}`, err);
            return false;
        }

        try {
            if (this.variables.copyOverwrite) {
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
        for (const list of matrix) {
            if (list[column] !== value) {
                return false;
            }
        }

        return true;
    }

    findCommonParentFolderPath(files: string[]): string {
        if (!files[0]) {
            return '';
        }

        const tokenMatrix = files.map(Q => Q.split('/'));
        // "/a/b/c" --> [a,b,c]

        const commonPath: string[] = [];

        let i = 0;
        do {
            const sample = tokenMatrix[0][i];
            // console.log(sample);
            // [[a,b,c], [d,e,f]] --> 'a' or 'b' or 'c'

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

    async tryCopy(job: CopyOption): Promise<number> {
        const libraryPath = upath.join(this.pathFinder.npmFolder, job.library);
        const targetPath = upath.join(this.pathFinder.outputFolderPath, job.destination);

        const tasks: Promise<boolean>[] = [];
        const globs: string[] = [];

        for (const file of job.files) {
            const absoluteFilePath = upath.join(libraryPath, file);
            // need to do this to squash folder navigations ('../')
            const relativeFilePath = upath.relative(libraryPath, absoluteFilePath);
            if (relativeFilePath.startsWith('../')) {
                Shout.warning(`Copy skip: ${chalk.cyan(file)} is outside library ${chalk.cyan(job.library)} folder!`);
                continue;
            }

            try {
                // there is a small but very real chance that we have glob-like path entered by user...
                // for example: '/project/node_modules/something/!(an|actual)_{folder}_[yo]/wtf
                // that file or folder must not be treated as glob! (escaped)

                const fileStats = await fse.lstat(absoluteFilePath);
                if (fileStats.isFile()) {
                    globs.push(FastGlob.escapePath(relativeFilePath));
                } else if (fileStats.isDirectory()) {
                    const globbedPath = upath.join(FastGlob.escapePath(relativeFilePath), '**');
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

        const assets = await FastGlob(globs, {
            cwd: libraryPath
        }); // folder/something.svg

        const commonPath = this.findCommonParentFolderPath(assets); // folder
        // console.log('COMMON PATH:', commonPath);

        for (const asset of assets) {
            const absoluteFilePath = upath.join(libraryPath, asset); // /project/node_modules/library/folder/something.svg
            const relativeFilePath = upath.relative(commonPath, asset); // something.svg
            const targetFilePath = upath.join(targetPath, relativeFilePath); // /project/wwwroot/target/something.svg
            // console.log(relativeFilePath);
            // console.log(absoluteFilePath);
            // console.log(targetFilePath);
            const task = this.tryCopyFile(absoluteFilePath, targetFilePath);
            tasks.push(task)
        }

        const success = await Promise.all(tasks);
        return success.filter(Q => Q).length;
    }

    async build(): Promise<number> {
        const packageJson = await fse.readJson(this.pathFinder.packageJson);
        const dependencies = new Set<string>();
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

        const copyTasks: Promise<number>[] = [];
        for (const job of this.variables.copy) {
            if (dependencies.has(job.library)) {
                copyTasks.push(this.tryCopy(job));
            } else {
                Shout.error(`Copy skip: Project package.json has no ${chalk.cyan(job.library)} dependency!`);
            }
        }

        const success = await Promise.all(copyTasks);
        let count = 0;
        for (const n of success) {
            count += n;
        }
        return count;
    }
}
