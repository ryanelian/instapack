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
const fse = require("fs-extra");
const upath = require("upath");
const chalk = require("chalk");
const ReadProjectSettings_1 = require("./variables-factory/ReadProjectSettings");
const EnvParser_1 = require("./variables-factory/EnvParser");
const CompileVariables_1 = require("./variables-factory/CompileVariables");
const PathFinder_1 = require("./variables-factory/PathFinder");
const ProcessInvoke_1 = require("./ProcessInvoke");
const Shout_1 = require("./Shout");
const ToolOrchestrator_1 = require("./ToolOrchestrator");
const TypescriptConfigParser_1 = require("./TypescriptConfigParser");
const MergePackageJson_1 = require("./MergePackageJson");
const UserSettingsManager_1 = require("./user-settings/UserSettingsManager");
const UserSettingsPath_1 = require("./user-settings/UserSettingsPath");
module.exports = class InstapackProgram {
    constructor(projectFolder) {
        this.projectFolder = upath.normalize(projectFolder);
    }
    get availableBuildTasks() {
        return ['all', 'js', 'css'];
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
    ensureSetupHttps() {
        return __awaiter(this, void 0, void 0, function* () {
            const certExistsAsync = fse.pathExists(UserSettingsPath_1.UserSettingsPath.certFile);
            const keyExistsAsync = fse.pathExists(UserSettingsPath_1.UserSettingsPath.keyFile);
            if ((yield certExistsAsync) && (yield keyExistsAsync)) {
                Shout_1.Shout.timed('Using existing HTTPS cert file: ' + chalk.cyan(UserSettingsPath_1.UserSettingsPath.certFile));
                Shout_1.Shout.timed('Using existing HTTPS key file: ' + chalk.cyan(UserSettingsPath_1.UserSettingsPath.keyFile));
                return true;
            }
            try {
                yield ProcessInvoke_1.setupHttps();
                return true;
            }
            catch (error) {
                Shout_1.Shout.error('when setting up HTTPS for hot reload dev server:', error);
                return false;
            }
        });
    }
    build(taskName, flags) {
        return __awaiter(this, void 0, void 0, function* () {
            const projectSettings = ReadProjectSettings_1.readProjectSettingsFrom(this.projectFolder);
            const dotEnv = EnvParser_1.readDotEnvFrom(this.projectFolder);
            const userSettings = yield UserSettingsManager_1.getSettings();
            const typescriptConfiguration = TypescriptConfigParser_1.tryReadTypeScriptConfigJson(this.projectFolder);
            const variables = CompileVariables_1.compileVariables(flags, yield projectSettings, userSettings, yield dotEnv, yield typescriptConfiguration);
            if (variables.packageManager !== 'disabled') {
                const finder = new PathFinder_1.PathFinder(variables);
                const packageJsonPath = finder.packageJson;
                const packageJsonExists = yield fse.pathExists(packageJsonPath);
                if (packageJsonExists) {
                    try {
                        yield ProcessInvoke_1.restorePackages(variables.packageManager);
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
                const httpsOK = yield this.ensureSetupHttps();
                if (!httpsOK) {
                    Shout_1.Shout.error('failed to setup HTTPS for hot reload dev server. Aborting build!');
                    return;
                }
            }
            const tm = new ToolOrchestrator_1.ToolOrchestrator(variables);
            tm.outputBuildInformation();
            tm.build(taskName);
        });
    }
    scaffold(template) {
        return __awaiter(this, void 0, void 0, function* () {
            const templateFolder = upath.join(__dirname, '../templates', template);
            const exist = yield fse.pathExists(templateFolder);
            if (!exist) {
                Shout_1.Shout.error('Unable to find new project template for:', chalk.cyan(template));
                return;
            }
            let mergedPackageJson;
            const projectPackageJsonPath = upath.join(this.projectFolder, 'package.json');
            const templatePackageJsonPath = upath.join(templateFolder, 'package.json');
            if ((yield fse.pathExists(projectPackageJsonPath)) && (yield fse.pathExists(templatePackageJsonPath))) {
                const projectPackageJson = yield fse.readJson(projectPackageJsonPath);
                const templatePackageJson = yield fse.readJson(templatePackageJsonPath);
                mergedPackageJson = MergePackageJson_1.mergePackageJson(projectPackageJson, templatePackageJson);
            }
            console.log('Initializing new project using template:', chalk.cyan(template));
            console.log('Scaffolding project into your web app...');
            yield fse.copy(templateFolder, this.projectFolder);
            if (mergedPackageJson) {
                console.log(`Merging ${chalk.blue('package.json')}...`);
                yield fse.writeJson(projectPackageJsonPath, mergedPackageJson, {
                    spaces: 2
                });
            }
            console.log(chalk.green('Scaffold completed.'), 'To build the app, type:', chalk.yellow('ipack'));
        });
    }
    changeUserSettings(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const settingsFilePath = yield UserSettingsManager_1.setSetting(key, value);
                console.log('Successfully saved the new setting!');
                console.log(chalk.grey(settingsFilePath));
            }
            catch (error) {
                Shout_1.Shout.error('when saving new settings:', error);
            }
        });
    }
};
