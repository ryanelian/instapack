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
const Scaffold_1 = require("./Scaffold");
const fse = require("fs-extra");
const path = require("path");
module.exports = class instapack {
    get availableTasks() {
        return ['all', 'js', 'css', 'concat'];
    }
    get availableTemplates() {
        let templatesFolder = path.join(__dirname, '..', 'templates');
        let ar = fse.readdirSync(templatesFolder);
        let templates = ar.filter(Q => {
            let test = path.join(templatesFolder, Q);
            return fse.lstatSync(test).isDirectory();
        });
        return templates;
    }
    constructor() {
        this.settings = Settings_1.Settings.tryReadFromPackageJson();
    }
    build(taskName, flags) {
        let compiler = new Compiler_1.Compiler(this.settings, flags);
        let scaffold = new Scaffold_1.Scaffold();
        if (compiler.needPackageRestore) {
            scaffold.restorePackages();
        }
        compiler.build(taskName);
    }
    scaffold(template) {
        return __awaiter(this, void 0, void 0, function* () {
            let scaffold = new Scaffold_1.Scaffold();
            yield scaffold.usingTemplate(template);
        });
    }
    clean() {
        return __awaiter(this, void 0, void 0, function* () {
            let cleanCSS = fse.emptyDir(this.settings.outputCssFolder);
            let cleanJS = fse.emptyDir(this.settings.outputJsFolder);
            let cleanCache = yield fse.pathExists(this.settings.cacheFolder);
            if (cleanCache) {
                try {
                    let yesterday = new Date().getTime() - 24 * 60 * 60 * 1000;
                    let oldCacheCount = 0;
                    let files = yield fse.readdir(this.settings.cacheFolder);
                    for (let file of files) {
                        let filePath = path.join(this.settings.cacheFolder, file);
                        let stat = yield fse.stat(filePath);
                        if (stat.ctimeMs < yesterday) {
                            yield fse.remove(filePath);
                            oldCacheCount++;
                        }
                    }
                    if (oldCacheCount) {
                        console.log('Clean cache successful: ' + oldCacheCount + ' files');
                    }
                }
                catch (error) {
                    console.error(error);
                }
            }
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
};
