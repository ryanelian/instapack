"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prettyJSON = require("prettyjson");
const chalk = require("chalk");
function PipeErrorHandler(error) {
    try {
        console.log(prettyJSON.render(error, {
            keysColor: 'red',
            dashColor: 'red',
        }));
    }
    catch (ex) {
        console.log(chalk.red(error));
    }
    this.emit('end');
}
exports.default = PipeErrorHandler;
