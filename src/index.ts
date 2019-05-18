import * as fse from 'fs-extra';
import * as upath from 'upath';
import chalk from 'chalk';

import { ICommandLineFlags } from "./variables-factory/ICommandLineFlags";
import { readProjectSettingsFrom } from './variables-factory/ReadProjectSettings';
import { readDotEnvFrom } from './variables-factory/EnvParser';
import { compileVariables } from './variables-factory/CompileVariables';
import { PathFinder } from './variables-factory/PathFinder';
import { PackageManager } from './PackageManager';
import { Shout } from './Shout';
import { ToolOrchestrator } from './ToolOrchestrator';
import { tryReadTypeScriptConfigJson } from './TypescriptConfigParser';
import { mergePackageJson } from './MergePackageJson';
import { getSettings, setSetting } from './user-settings/UserSettingsManager';

/**
 * Exposes methods for developing a web app client project.
 */
export = class instapack {

    readonly projectFolder: string;

    /**
     * Constructs instapack class instance using settings read from project.json. 
     */
    constructor(projectFolder: string) {
        this.projectFolder = upath.normalize(projectFolder);
    }

    /**
     * Gets a list of string which contains tasks available for the build method.
     */
    get availableBuildTasks() {
        return ['all', 'js', 'css'];
    }

    /**
     * Gets a list of string which contains templates available for the scaffold method.
     */
    get availableTemplates() {
        let templatesFolder = upath.join(__dirname, '..', 'templates');

        let ar = fse.readdirSync(templatesFolder);
        let templates = ar.filter(Q => {
            let test = upath.join(templatesFolder, Q);
            return fse.lstatSync(test).isDirectory();
        });

        // This getter should only be called on `ipack new` command call. 
        // console.log(templates);
        return templates;
    }

    /**
     * Performs web app client project compilation using a pre-configured task and build flags.
     * @param taskName 
     * @param flags 
     */
    async build(taskName: string, flags: ICommandLineFlags) {
        if (flags.verbose) {
            Shout.displayVerboseOutput = true;
        }

        // parallel IO
        let projectSettings = readProjectSettingsFrom(this.projectFolder);
        let dotEnv = readDotEnvFrom(this.projectFolder);
        let userSettings = await getSettings();
        let typescriptConfiguration = tryReadTypeScriptConfigJson(this.projectFolder);

        let variables = compileVariables(flags,
            await projectSettings,
            await userSettings,
            await dotEnv,
            await typescriptConfiguration
        );

        if (variables.muteNotification) {
            Shout.enableNotification = false;
        }

        if (variables.packageManager !== 'disabled') {
            let finder = new PathFinder(variables);
            let packageJsonPath = finder.packageJson;
            let packageJsonExists = await fse.pathExists(packageJsonPath);
            if (packageJsonExists) {
                try {
                    let pm = new PackageManager();
                    await pm.restore(variables.packageManager);
                } catch (error) {
                    Shout.error('when restoring package:', error);
                }
            } else {
                Shout.warning('unable to find', chalk.cyan(packageJsonPath), chalk.grey('skipping package restore...'));
            }
        }

        let tm = new ToolOrchestrator(variables);
        tm.outputBuildInformation();
        tm.build(taskName);
    }

    /**
     * Performs new web app client project scaffolding using a template shipped in templates folder.
     * @param template 
     */
    async scaffold(template: string) {
        let templateFolder = upath.join(__dirname, '../templates', template);

        let exist = await fse.pathExists(templateFolder);
        if (!exist) {
            Shout.error('Unable to find new project template for:', chalk.cyan(template));
            return;
        }

        let mergedPackageJson: any;
        let projectPackageJsonPath = upath.join(this.projectFolder, 'package.json');
        let templatePackageJsonPath = upath.join(templateFolder, 'package.json');
        if (await fse.pathExists(projectPackageJsonPath) && await fse.pathExists(templatePackageJsonPath)) {
            // would override, should merge fields instead: instapack, dependencies, and devDependencies
            let projectPackageJson = await fse.readJson(projectPackageJsonPath);
            let templatePackageJson = await fse.readJson(templatePackageJsonPath);

            mergedPackageJson = mergePackageJson(projectPackageJson, templatePackageJson);
        }

        console.log('Initializing new project using template:', chalk.cyan(template));
        console.log('Scaffolding project into your web app...');
        await fse.copy(templateFolder, this.projectFolder);

        if (mergedPackageJson) {
            console.log(`Merging ${chalk.blue('package.json')}...`);
            await fse.writeJson(projectPackageJsonPath, mergedPackageJson, {
                spaces: 2
            });
        }

        console.log(chalk.green('Scaffold completed.'), 'To build the app, type:', chalk.yellow('ipack'));
    }

    /**
     * Change an instapack user global setting.
     * @param key 
     * @param value 
     */
    async changeUserSettings(key: string, value: string) {
        try {
            await setSetting(key, value);
            console.log('Successfully saved the new setting!');
        } catch (error) {
            Shout.error('when saving new settings:', error);
        }
    }
}
