"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Compiler_1 = require("./src/Compiler");
const Scaffold_1 = require("./src/Scaffold");
class Instapack {
    build(taskName, isProduction, watchMode) {
        let compiler = new Compiler_1.Compiler(isProduction, watchMode);
        compiler.build(taskName);
    }
    scaffold(template) {
        let scaffold = new Scaffold_1.Scaffold();
        scaffold.usingTemplate(template);
    }
}
exports.Instapack = Instapack;
