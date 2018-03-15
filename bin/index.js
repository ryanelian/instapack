"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const Compiler_1 = require("./Compiler");
const Settings_1 = require("./Settings");
const fse = require("fs-extra");
const upath = require("upath");
const chalk_1 = require("chalk");
const GlobalSettingsManager_1 = require("./GlobalSettingsManager");
const PackageManagers_1 = require("./PackageManagers");
module.exports = class instapack {
    get availableTasks() {
        return ['all', 'js', 'css', 'concat'];
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
    constructor(projectFolder) {
        this.projectFolder = projectFolder;
        this.settings = Settings_1.Settings.tryReadFromPackageJson(projectFolder);
    }
    build(taskName, flags) {
        let packageManager = new PackageManagers_1.PackageManager();
        let compiler = new Compiler_1.Compiler(this.settings, flags);
        packageManager.restore().catch(error => {
            console.error(chalk_1.default.red('ERROR'), 'when restoring package:');
            console.error(error);
        }).then(() => {
            compiler.build(taskName);
        });
    }
    scaffold(template) {
        return __awaiter(this, void 0, void 0, function* () {
            let templateFolder = upath.join(__dirname, '../templates', template);
            let exist = yield fse.pathExists(templateFolder);
            if (!exist) {
                console.error(chalk_1.default.red('ERROR') + ' Unable to find new project template for: ' + chalk_1.default.cyan(template));
                return;
            }
            console.log('Initializing new project using template: ' + chalk_1.default.cyan(template));
            console.log('Scaffolding project into your web app...');
            yield fse.copy(templateFolder, this.projectFolder);
            console.log(chalk_1.default.green('Scaffold completed.') + 'To build the app, type: ' + chalk_1.default.yellow('ipack'));
        });
    }
    clean() {
        return __awaiter(this, void 0, void 0, function* () {
            let cleanCSS = fse.emptyDir(this.settings.outputCssFolder);
            let cleanJS = fse.emptyDir(this.settings.outputJsFolder);
            try {
                yield cleanJS;
                console.log('Clean successful: ' + this.settings.outputJsFolder);
                yield cleanCSS;
                console.log('Clean successful: ' + this.settings.outputCssFolder);
            }
            catch (error) {
                console.error(error);
            }
        });
    }
    setGlobalConfiguration(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            let settingsManager = new GlobalSettingsManager_1.GlobalSettingsManager();
            let valid = settingsManager.validate(key, value);
            if (!valid) {
                console.error(chalk_1.default.red('ERROR'), 'invalid settings.');
                return;
            }
            yield settingsManager.set(key, value);
        });
    }
};
