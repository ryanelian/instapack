"use strict";
const Compiler_1 = require("./src/Compiler");
const Settings_1 = require("./src/Settings");
const Scaffold_1 = require("./src/Scaffold");
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
    build(taskName, productionMode, watchMode, serverPort) {
        let compiler = new Compiler_1.Compiler(this.settings, {
            productionMode: productionMode,
            watchMode: watchMode,
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
};
