"use strict";
const fse = require("fs-extra");
const upath = require("upath");
const chalk = require("chalk");
const ReadProjectSettings_1 = require("./variables-factory/ReadProjectSettings");
const EnvParser_1 = require("./variables-factory/EnvParser");
const PathFinder_1 = require("./variables-factory/PathFinder");
const ProcessInvoke_1 = require("./ProcessInvoke");
const Shout_1 = require("./Shout");
const ToolOrchestrator_1 = require("./ToolOrchestrator");
const TypescriptConfigParser_1 = require("./TypescriptConfigParser");
const MergePackageJson_1 = require("./MergePackageJson");
const UserSettingsManager_1 = require("./user-settings/UserSettingsManager");
const UserSettingsPath_1 = require("./user-settings/UserSettingsPath");
const BuildVariables_1 = require("./variables-factory/BuildVariables");
module.exports = class InstapackProgram {
    constructor(projectFolder) {
        this.projectFolder = upath.normalize(projectFolder);
    }
    get availableBuildTasks() {
        return ['all', 'js', 'css', 'copy'];
    }
    get availableTemplates() {
        const templatesFolder = upath.join(__dirname, '..', 'templates');
        const ar = fse.readdirSync(templatesFolder);
        const templates = ar.filter(Q => {
            const test = upath.join(templatesFolder, Q);
            return fse.lstatSync(test).isDirectory();
        });
        return templates;
    }
    async ensureSetupHttps() {
        const certExistsAsync = fse.pathExists(UserSettingsPath_1.UserSettingsPath.certFile);
        const keyExistsAsync = fse.pathExists(UserSettingsPath_1.UserSettingsPath.keyFile);
        if (await certExistsAsync && await keyExistsAsync) {
            Shout_1.Shout.timed('Using existing HTTPS cert file: ' + chalk.cyan(UserSettingsPath_1.UserSettingsPath.certFile));
            Shout_1.Shout.timed('Using existing HTTPS key file: ' + chalk.cyan(UserSettingsPath_1.UserSettingsPath.keyFile));
            return true;
        }
        try {
            await ProcessInvoke_1.setupHttps();
            return true;
        }
        catch (error) {
            Shout_1.Shout.error('when setting up HTTPS for hot reload dev server:', error);
            return false;
        }
    }
    async build(taskName, flags) {
        const projectSettingsAsync = ReadProjectSettings_1.readProjectSettingsFrom(this.projectFolder);
        const dotEnvAsync = EnvParser_1.readDotEnvFrom(this.projectFolder);
        const userSettingsAsync = UserSettingsManager_1.getSettings();
        const typescriptConfigurationAsync = TypescriptConfigParser_1.tryReadTypeScriptConfigJson(this.projectFolder);
        const variables = BuildVariables_1.uniteBuildVariables(flags, await projectSettingsAsync, await userSettingsAsync, await dotEnvAsync, await typescriptConfigurationAsync);
        if (variables.packageManager !== 'disabled') {
            const finder = new PathFinder_1.PathFinder(variables);
            const packageJsonPath = finder.packageJson;
            const packageJsonExists = await fse.pathExists(packageJsonPath);
            if (packageJsonExists) {
                try {
                    await ProcessInvoke_1.restorePackages(variables.packageManager);
                }
                catch (error) {
                    Shout_1.Shout.error('when restoring package:', error);
                }
            }
            else {
                Shout_1.Shout.warning('unable to find', chalk.cyan(packageJsonPath), chalk.grey('skipping package restore...'));
            }
        }
        if (variables.https) {
            const httpsOK = await this.ensureSetupHttps();
            if (!httpsOK) {
                Shout_1.Shout.error('failed to setup HTTPS for hot reload dev server. Aborting build!');
                return;
            }
        }
        const tm = new ToolOrchestrator_1.ToolOrchestrator(variables);
        tm.outputBuildInformation();
        tm.build(taskName);
    }
    async scaffold(template) {
        const templateFolder = upath.join(__dirname, '../templates', template);
        const exist = await fse.pathExists(templateFolder);
        if (!exist) {
            Shout_1.Shout.error('Unable to find new project template for:', chalk.cyan(template));
            return;
        }
        let mergedPackageJson;
        const projectPackageJsonPath = upath.join(this.projectFolder, 'package.json');
        const templatePackageJsonPath = upath.join(templateFolder, 'package.json');
        if (await fse.pathExists(projectPackageJsonPath) && await fse.pathExists(templatePackageJsonPath)) {
            const projectPackageJson = await fse.readJson(projectPackageJsonPath);
            const templatePackageJson = await fse.readJson(templatePackageJsonPath);
            mergedPackageJson = MergePackageJson_1.mergePackageJson(projectPackageJson, templatePackageJson);
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
    async changeUserSettings(key, value) {
        try {
            const settingsFilePath = await UserSettingsManager_1.setSetting(key, value);
            console.log('Successfully saved the new setting!');
            console.log(chalk.grey(settingsFilePath));
        }
        catch (error) {
            Shout_1.Shout.error('when saving new settings:', error);
        }
    }
};
