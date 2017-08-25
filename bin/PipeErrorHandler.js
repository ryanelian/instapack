"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
const PrettyObject_1 = require("./PrettyObject");
let p = new PrettyObject_1.PrettyObject();
function PipeErrorHandler(error) {
    try {
        console.log(p.render(error));
    }
    catch (ex) {
        console.log(chalk.red(error));
    }
    this.emit('end');
}
exports.default = PipeErrorHandler;
