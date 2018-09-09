"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fs_extra_1 = __importDefault(require("fs-extra"));
const upath_1 = __importDefault(require("upath"));
const chalk_1 = __importDefault(require("chalk"));
const VariablesFactory_1 = require("./VariablesFactory");
const UserSettingsManager_1 = require("./UserSettingsManager");
const PathFinder_1 = require("./PathFinder");
const PackageManager_1 = require("./PackageManager");
const Shout_1 = require("./Shout");
const ToolOrchestrator_1 = require("./ToolOrchestrator");
function objectSortByKeys(input) {
    let output = {};
    let keys = Object.keys(input).sort();
    for (let key of keys) {
        output[key] = input[key];
    }
    return output;
}
function mergePackageJson(projectPackageJson, templatePackageJson) {
    let packageJson = JSON.parse(JSON.stringify(projectPackageJson));
    if (templatePackageJson.instapack) {
        packageJson.instapack = templatePackageJson.instapack;
    }
    if (!packageJson.dependencies) {
        packageJson.dependencies = {};
    }
    if (!packageJson.devDependencies) {
        packageJson.devDependencies = {};
    }
    if (templatePackageJson.dependencies) {
        for (let packageName in templatePackageJson.dependencies) {
            if (packageJson.devDependencies[packageName]) {
                packageJson.devDependencies[packageName] = templatePackageJson.dependencies[packageName];
            }
            else {
                packageJson.dependencies[packageName] = templatePackageJson.dependencies[packageName];
            }
        }
    }
    if (templatePackageJson.devDependencies) {
        for (let packageName in templatePackageJson.devDependencies) {
            if (packageJson.dependencies[packageName]) {
                packageJson.dependencies[packageName] = templatePackageJson.devDependencies[packageName];
            }
            else {
                packageJson.devDependencies[packageName] = templatePackageJson.devDependencies[packageName];
            }
        }
    }
    packageJson.dependencies = objectSortByKeys(packageJson.dependencies);
    packageJson.devDependencies = objectSortByKeys(packageJson.devDependencies);
    return packageJson;
}
module.exports = class instapack {
    constructor(projectFolder) {
        this.projectFolder = upath_1.default.normalize(projectFolder);
    }
    get availableBuildTasks() {
        return ['all', 'js', 'css'];
    }
    get availableTemplates() {
        let templatesFolder = upath_1.default.join(__dirname, '..', 'templates');
        let ar = fs_extra_1.default.readdirSync(templatesFolder);
        let templates = ar.filter(Q => {
            let test = upath_1.default.join(templatesFolder, Q);
            return fs_extra_1.default.lstatSync(test).isDirectory();
        });
        return templates;
    }
    get availableSettings() {
        return new UserSettingsManager_1.UserSettingsManager().availableSettings;
    }
    build(taskName, flags) {
        return __awaiter(this, void 0, void 0, function* () {
            let userMan = new UserSettingsManager_1.UserSettingsManager();
            let v = new VariablesFactory_1.VariablesFactory();
            if (flags.verbose) {
                Shout_1.Shout.displayVerboseOutput = true;
            }
            let projectSettings = v.readProjectSettingsFrom(this.projectFolder);
            let dotEnv = v.readDotEnvFrom(this.projectFolder);
            let userSettings = userMan.readUserSettingsFrom(userMan.userSettingsFilePath);
            let variables = v.compile(flags, yield projectSettings, yield userSettings, yield dotEnv);
            if (variables.muteNotification) {
                Shout_1.Shout.enableNotification = false;
            }
            if (variables.packageManager !== 'disabled') {
                let finder = new PathFinder_1.PathFinder(variables);
                let packageJsonPath = finder.packageJson;
                let packageJsonExists = yield fs_extra_1.default.pathExists(packageJsonPath);
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
            let templateFolder = upath_1.default.join(__dirname, '../templates', template);
            let exist = yield fs_extra_1.default.pathExists(templateFolder);
            if (!exist) {
                Shout_1.Shout.error('Unable to find new project template for:', chalk_1.default.cyan(template));
                return;
            }
            let mergedPackageJson;
            let projectPackageJsonPath = upath_1.default.join(this.projectFolder, 'package.json');
            let templatePackageJsonPath = upath_1.default.join(templateFolder, 'package.json');
            if ((yield fs_extra_1.default.pathExists(projectPackageJsonPath)) && (yield fs_extra_1.default.pathExists(templatePackageJsonPath))) {
                let projectPackageJson = yield fs_extra_1.default.readJson(projectPackageJsonPath);
                let templatePackageJson = yield fs_extra_1.default.readJson(templatePackageJsonPath);
                mergedPackageJson = mergePackageJson(projectPackageJson, templatePackageJson);
            }
            console.log('Initializing new project using template:', chalk_1.default.cyan(template));
            console.log('Scaffolding project into your web app...');
            yield fs_extra_1.default.copy(templateFolder, this.projectFolder);
            if (mergedPackageJson) {
                console.log(`Merging ${chalk_1.default.blue('package.json')}...`);
                yield fs_extra_1.default.writeJson(projectPackageJsonPath, mergedPackageJson, {
                    spaces: 2
                });
            }
            console.log(chalk_1.default.green('Scaffold completed.'), 'To build the app, type:', chalk_1.default.yellow('ipack'));
        });
    }
    changeUserSettings(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            let man = new UserSettingsManager_1.UserSettingsManager();
            let valid = man.validate(key, value);
            if (!valid) {
                Shout_1.Shout.error('invalid setting! Please consult README.');
                return;
            }
            try {
                let file = man.userSettingsFilePath;
                let settings = yield man.readUserSettingsFrom(file);
                man.set(settings, key, value);
                yield fs_extra_1.default.outputJson(file, settings);
            }
            catch (error) {
                Shout_1.Shout.error('when saving new settings:', error);
            }
        });
    }
};
