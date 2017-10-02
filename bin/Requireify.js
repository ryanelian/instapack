"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tools = require("browserify-transform-tools");
const chalk = require("chalk");
const GulpLog_1 = require("./GulpLog");
function Requireify(alias, externals) {
    let replicant = {};
    for (let key in alias) {
        let realKey = key.toLowerCase();
        replicant[realKey] = 'require("' + alias[key] + '")';
    }
    for (let key in externals) {
        let realKey = key.toLowerCase();
        if (replicant[realKey]) {
            GulpLog_1.default(chalk.red('WARNING'), 'module import transform for', chalk.blue(realKey), 'was defined for both', chalk.yellow('alias'), 'and', chalk.yellow('externals'));
        }
        replicant[realKey] = 'window["' + externals[key] + '"]';
    }
    return tools.makeRequireTransform('requireify', function (args, context, cb) {
        let key = args[0];
        if (!key) {
            return cb();
        }
        let value = replicant[key.toLowerCase()];
        if (value) {
            return cb(null, value);
        }
        else {
            return cb();
        }
    });
}
exports.default = Requireify;
