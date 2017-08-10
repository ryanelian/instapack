"use strict";
const Compiler_1 = require("./src/Compiler");
const Settings_1 = require("./src/Settings");
const Scaffold_1 = require("./src/Scaffold");
const fse = require("fs-extra");
module.exports = class instapack {
    get availableTasks() {
        return ['all', 'js', 'css', 'concat'];
    }
    get availableTemplates() {
        return ['empty', 'aspnet', 'angularjs', 'angular-material'];
    }
    constructor() {
        this.settings = Settings_1.Settings.tryRead();
    }
    build(taskName, minify, watch, map, serverPort) {
        let compiler = new Compiler_1.Compiler(this.settings, {
            minify: minify,
            watch: watch,
            map: map,
            serverPort: serverPort
        });
        let scaffold = new Scaffold_1.Scaffold();
        if (compiler.needPackageRestore()) {
            scaffold.restorePackages();
        }
        compiler.build(taskName);
    }
    scaffold(template) {
        let scaffold = new Scaffold_1.Scaffold();
        scaffold.usingTemplate(template);
    }
    clean() {
        let dir1 = this.settings.outputCssFolder;
        let dir2 = this.settings.outputJsFolder;
        fse.emptyDir(dir1, err => {
            if (err) {
                console.log('Error when cleaning ' + dir1);
                console.log(err);
            }
            else {
                console.log('Successfully cleaned ' + dir1);
            }
        });
        fse.emptyDir(dir2, err => {
            if (err) {
                console.log('Error when cleaning ' + dir2);
                console.log(err);
            }
            else {
                console.log('Successfully cleaned ' + dir2);
            }
        });
    }
};
