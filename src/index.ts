import * as fse from 'fs-extra';
import * as upath from 'upath';
import chalk = require('chalk');

import { readProjectSettingsFrom } from './variables-factory/ReadProjectSettings';
import { readDotEnvFrom } from './variables-factory/EnvParser';
import { restorePackages, setupHttps } from './ProcessInvoke';
import { Shout } from './Shout';
import { ToolOrchestrator } from './ToolOrchestrator';
import { tryReadTypeScriptConfigJson } from './TypescriptConfigParser';
import { mergePackageJson } from './MergePackageJson';
import { getSettings, setSetting } from './user-settings/UserSettingsManager';
import { UserSettingsPath } from './user-settings/UserSettingsPath';
import { uniteBuildVariables, CommandLineFlags } from './variables-factory/BuildVariables';

/**
 * Exposes methods for developing a web app client project.
 */
export = class InstapackProgram {

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
    get availableBuildTasks(): string[] {
        return ['all', 'js', 'css', 'copy'];
    }

    /**
     * Gets a list of string which contains templates available for the scaffold method.
     */
    get availableTemplates(): string[] {
        const templatesFolder = upath.join(__dirname, '..', 'templates');

        const ar = fse.readdirSync(templatesFolder);
        const templates = ar.filter(Q => {
            const test = upath.join(templatesFolder, Q);
            return fse.lstatSync(test).isDirectory();
        });

        // This getter should only be called on `ipack new` command call. 
        // console.log(templates);
        return templates;
    }

    async ensureSetupHttps(): Promise<boolean> {
        const certExistsAsync = fse.pathExists(UserSettingsPath.certFile);
        const keyExistsAsync = fse.pathExists(UserSettingsPath.keyFile);

        if (await certExistsAsync && await keyExistsAsync) {
            Shout.timed('Using existing HTTPS cert file: ' + chalk.cyan(UserSettingsPath.certFile))
            Shout.timed('Using existing HTTPS key file: ' + chalk.cyan(UserSettingsPath.keyFile))
            return true;
        }

        try {
            await setupHttps();
            return true;
        } catch (error) {
            Shout.error('when setting up HTTPS for hot reload dev server:', error);
            return false;
        }
    }

    /**
     * Performs web app client project compilation using a pre-configured task and build flags.
     * @param taskName 
     * @param flags 
     */
    async build(taskName: string, flags: CommandLineFlags): Promise<void> {
        // parallel async IO
        const projectSettingsAsync = readProjectSettingsFrom(this.projectFolder);
        const dotEnvAsync = readDotEnvFrom(this.projectFolder);
        const userSettingsAsync = getSettings();
        const typescriptConfigurationAsync = tryReadTypeScriptConfigJson(this.projectFolder);

        const variables = uniteBuildVariables(flags,
            await projectSettingsAsync,
            await userSettingsAsync,
            await dotEnvAsync,
            await typescriptConfigurationAsync
        );

        try {
            await restorePackages(variables.packageManager, variables.root);
        } catch (error) {
            Shout.error('when restoring package:', error);
        }

        if (variables.https) {
            const httpsOK = await this.ensureSetupHttps();
            if (!httpsOK) {
                Shout.error('failed to setup HTTPS for hot reload dev server. Aborting build!');
                return;
            }
        }

        const tm = new ToolOrchestrator(variables);
        tm.outputBuildInformation();
        tm.build(taskName);
    }

    /**
     * Performs new web app client project scaffolding using a template shipped in templates folder.
     * @param template 
     */
    async scaffold(template: string): Promise<void> {
        const templateFolder = upath.join(__dirname, '../templates', template);

        const exist = await fse.pathExists(templateFolder);
        if (!exist) {
            Shout.error('Unable to find new project template for:', chalk.cyan(template));
            return;
        }

        let mergedPackageJson: unknown;
        const projectPackageJsonPath = upath.join(this.projectFolder, 'package.json');
        const templatePackageJsonPath = upath.join(templateFolder, 'package.json');
        if (await fse.pathExists(projectPackageJsonPath) && await fse.pathExists(templatePackageJsonPath)) {
            // would override, should merge fields instead: instapack, dependencies, and devDependencies
            const projectPackageJson = await fse.readJson(projectPackageJsonPath);
            const templatePackageJson = await fse.readJson(templatePackageJsonPath);

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
    async changeUserSettings(key: string, value: string): Promise<void> {
        try {
            const settingsFilePath = await setSetting(key, value);
            console.log('Successfully saved the new setting!');
            console.log(chalk.grey(settingsFilePath));
        } catch (error) {
            Shout.error('when saving new settings:', error);
        }
    }
}
