import { IVariables } from "./variables-factory/IVariables";
import { Shout } from "./Shout";
import { VoiceAssistant } from "./VoiceAssistant";
import { prettyHrTime } from "./PrettyUnits";
import chalk from "chalk";
import * as upath from 'upath';
import * as fse from 'fs-extra';
import { PathFinder } from "./variables-factory/PathFinder";

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
        Shout.timed(`Copying ${this.variables.copy.length} asset(s) ${chalk.grey('to ' + this.pathFinder.outputFolderPath)} ${chalk.yellow('(non-overwrite)')}`);
        let start = process.hrtime();
        try {
            await this.build();
        }
        catch (error) {
            this.va.speak('COPY TASK ERROR!');
            Shout.error('during Copy build task:', error);
        }
        finally {
            let time = prettyHrTime(process.hrtime(start));
            Shout.timed('Finished Copy build task after', chalk.green(time));
        }
    }

    async tryCopy(value: string, overwrite: boolean) {
        let absolutePath = upath.join(this.pathFinder.npmFolder, value);
        let isInsideNpmFolder = absolutePath.startsWith(this.pathFinder.npmFolder);
        if (isInsideNpmFolder === false) {
            Shout.warning(`Copy skip: Path "${value}" is outside npm folder!`);
            return;
        }

        let isPathExist = await fse.pathExists(absolutePath);
        if (isPathExist === false) {
            Shout.warning(`Copy skip: Path "${value}" does not exists!`);
            return;
        }

        let folderOrFileName = upath.basename(absolutePath);
        let targetPath = upath.join(this.pathFinder.outputFolderPath, folderOrFileName);
        await fse.copy(absolutePath, targetPath, {
            overwrite: overwrite
        });
    }

    async build() {
        let copyTasks: Promise<void>[] = [];
        for (let value of this.variables.copy) {
            copyTasks.push(this.tryCopy(value, false));
        }

        await Promise.all(copyTasks);
    }
}