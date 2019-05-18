"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const fse = require("fs-extra");
const upath = require("upath");
const chalk_1 = require("chalk");
const ReadProjectSettings_1 = require("./variables-factory/ReadProjectSettings");
const EnvParser_1 = require("./variables-factory/EnvParser");
const CompileVariables_1 = require("./variables-factory/CompileVariables");
const PathFinder_1 = require("./variables-factory/PathFinder");
const PackageManager_1 = require("./PackageManager");
const Shout_1 = require("./Shout");
const ToolOrchestrator_1 = require("./ToolOrchestrator");
const TypescriptConfigParser_1 = require("./TypescriptConfigParser");
const MergePackageJson_1 = require("./MergePackageJson");
const UserSettingsManager_1 = require("./user-settings/UserSettingsManager");
module.exports = class instapack {
    constructor(projectFolder) {
        this.projectFolder = upath.normalize(projectFolder);
    }
    get availableBuildTasks() {
        return ['all', 'js', 'css'];
    }
    get availableTemplates() {
        let templatesFolder = upath.join(__dirname, '..', 'templates');
        let ar = fse.readdirSync(templatesFolder);
        let templates = ar.filter(Q => {
            let test = upath.join(templatesFolder, Q);
            return fse.lstatSync(test).isDirectory();
        });
        return templates;
    }
    build(taskName, flags) {
        return __awaiter(this, void 0, void 0, function* () {
            if (flags.verbose) {
                Shout_1.Shout.displayVerboseOutput = true;
            }
            let projectSettings = ReadProjectSettings_1.readProjectSettingsFrom(this.projectFolder);
            let dotEnv = EnvParser_1.readDotEnvFrom(this.projectFolder);
            let userSettings = yield UserSettingsManager_1.getSettings();
            let typescriptConfiguration = TypescriptConfigParser_1.tryReadTypeScriptConfigJson(this.projectFolder);
            let variables = CompileVariables_1.compileVariables(flags, yield projectSettings, yield userSettings, yield dotEnv, yield typescriptConfiguration);
            if (variables.muteNotification) {
                Shout_1.Shout.enableNotification = false;
            }
            if (variables.packageManager !== 'disabled') {
                let finder = new PathFinder_1.PathFinder(variables);
                let packageJsonPath = finder.packageJson;
                let packageJsonExists = yield fse.pathExists(packageJsonPath);
                if (packageJsonExists) {
                    try {
                        let pm = new PackageManager_1.PackageManager();
                        yield pm.restore(variables.packageManager);
                    }
                    catch (error) {
                        Shout_1.Shout.error('when restoring package:', error);
                    }
                }
                else {
                    Shout_1.Shout.warning('unable to find', chalk_1.default.cyan(packageJsonPath), chalk_1.default.grey('skipping package restore...'));
                }
            }
            let tm = new ToolOrchestrator_1.ToolOrchestrator(variables);
            tm.outputBuildInformation();
            tm.build(taskName);
        });
    }
    scaffold(template) {
        return __awaiter(this, void 0, void 0, function* () {
            let templateFolder = upath.join(__dirname, '../templates', template);
            let exist = yield fse.pathExists(templateFolder);
            if (!exist) {
                Shout_1.Shout.error('Unable to find new project template for:', chalk_1.default.cyan(template));
                return;
            }
            let mergedPackageJson;
            let projectPackageJsonPath = upath.join(this.projectFolder, 'package.json');
            let templatePackageJsonPath = upath.join(templateFolder, 'package.json');
            if ((yield fse.pathExists(projectPackageJsonPath)) && (yield fse.pathExists(templatePackageJsonPath))) {
                let projectPackageJson = yield fse.readJson(projectPackageJsonPath);
                let templatePackageJson = yield fse.readJson(templatePackageJsonPath);
                mergedPackageJson = MergePackageJson_1.mergePackageJson(projectPackageJson, templatePackageJson);
            }
            console.log('Initializing new project using template:', chalk_1.default.cyan(template));
            console.log('Scaffolding project into your web app...');
            yield fse.copy(templateFolder, this.projectFolder);
            if (mergedPackageJson) {
                console.log(`Merging ${chalk_1.default.blue('package.json')}...`);
                yield fse.writeJson(projectPackageJsonPath, mergedPackageJson, {
                    spaces: 2
                });
            }
            console.log(chalk_1.default.green('Scaffold completed.'), 'To build the app, type:', chalk_1.default.yellow('ipack'));
        });
    }
    changeUserSettings(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield UserSettingsManager_1.setSetting(key, value);
                console.log('Successfully saved the new setting!');
            }
            catch (error) {
                Shout_1.Shout.error('when saving new settings:', error);
            }
        });
    }
};
