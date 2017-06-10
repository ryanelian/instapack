"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Compiler_1 = require("./src/Compiler");
const CompilerSettings_1 = require("./src/CompilerSettings");
const Scaffold_1 = require("./src/Scaffold");
const autoprefixer = require("autoprefixer");
const prettyJSON = require("prettyjson");
class instapack {
    get availableTasks() {
        return ['all', 'js', 'css', 'concat'];
    }
    get availableTemplates() {
        return ['empty', 'aspnet', 'angularjs'];
    }
    constructor() {
        this.settings = CompilerSettings_1.CompilerSettings.tryRead();
    }
    build(taskName, productionMode, watchMode) {
        let compiler = new Compiler_1.Compiler(productionMode, watchMode, this.settings);
        compiler.build(taskName);
    }
    scaffold(template) {
        let scaffold = new Scaffold_1.Scaffold();
        scaffold.usingTemplate(template);
    }
    displayAutoprefixInfo() {
        console.log(autoprefixer().info());
    }
    displaySettings() {
        console.log(prettyJSON.render(this.settings));
    }
}
exports.instapack = instapack;
