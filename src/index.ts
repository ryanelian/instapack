import * as fse from 'fs-extra';
import * as upath from 'upath';
import chalk = require('chalk');

import { readProjectSettingsFrom } from './variables-factory/ReadProjectSettings';
import { readVuePackageVersionsFrom } from "./importers/readVuePackageVersionsFrom";
import { readDotEnvFrom } from './variables-factory/EnvParser';
import { addVueCompilerServices, restorePackages, selectPackageManager, setupHttps } from './ProcessInvoke';
import { Shout } from './Shout';
import { BuildRunner } from './BuildRunner';
import { tryReadTypeScriptConfigJson } from './TypescriptConfigParser';
import { mergePackageJson, PackageJsonPartial } from './MergePackageJson';
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
            Shout.timed('Using existing HTTPS cert file: ' + chalk.cyanBright(UserSettingsPath.certFile))
            Shout.timed('Using existing HTTPS key file: ' + chalk.cyanBright(UserSettingsPath.keyFile))
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
            const packageManager = await selectPackageManager(variables.packageManager, variables.root);
            await restorePackages(packageManager, variables.root);

            const vueVersions = await readVuePackageVersionsFrom(this.projectFolder);
            if (vueVersions) {
                variables.vue = vueVersions;
                addVueCompilerServices(packageManager, vueVersions);
            }
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

        const builder = new BuildRunner(variables);
        builder.outputBuildInformation();
        builder.build(taskName);
    }

    /**
     * Performs new web app client project scaffolding using a template shipped in templates folder.
     * @param template 
     */
    async scaffold(template: string): Promise<void> {
        const templateFolder = upath.join(__dirname, '../templates', template);

        const exist = await fse.pathExists(templateFolder);
        if (!exist) {
            Shout.error('Unable to find new project template for:', chalk.cyanBright(template));
            return;
        }

        let projectPackageJson: PackageJsonPartial | undefined = undefined;
        const projectPackageJsonPath = upath.join(this.projectFolder, 'package.json');
        const templatePackageJsonPath = upath.join(templateFolder, 'package.json');
        const templatePackageJsonExistsAsync = fse.pathExists(templatePackageJsonPath);

        if (await fse.pathExists(projectPackageJsonPath)) {
            // read project package.json first because it will get overwritten by fse.copy below...
            projectPackageJson = await fse.readJson(projectPackageJsonPath);
        }

        console.log('Initializing new project using template:', chalk.cyanBright(template));
        console.log('Scaffolding project into your web app...');
        await fse.copy(templateFolder, this.projectFolder);

        if (projectPackageJson && await templatePackageJsonExistsAsync) {
            // package.json override, should merge fields instead: instapack, dependencies, and devDependencies
            console.log(`Merging ${chalk.blueBright('package.json')}...`);

            const templatePackageJson = await fse.readJson(templatePackageJsonPath);
            const mergedPackageJson = mergePackageJson(projectPackageJson, templatePackageJson);

            await fse.writeJson(projectPackageJsonPath, mergedPackageJson, {
                spaces: 2
            });
        }

        console.log(chalk.greenBright('Scaffold completed.'), 'To build the app, type:', chalk.yellowBright('ipack'));
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
