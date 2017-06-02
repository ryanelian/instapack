"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Compiler_1 = require("./src/Compiler");
const Scaffold_1 = require("./src/Scaffold");
class instapack {
    get availableTasks() {
        return ['all', 'js', 'css', 'concat'];
    }
    get availableTemplates() {
        return ['empty', 'aspnet', 'angularjs'];
    }
    build(taskName, productionMode, watchMode) {
        let compiler = new Compiler_1.Compiler(productionMode, watchMode);
        compiler.build(taskName);
    }
    scaffold(template) {
        let scaffold = new Scaffold_1.Scaffold();
        scaffold.usingTemplate(template);
    }
}
exports.instapack = instapack;
