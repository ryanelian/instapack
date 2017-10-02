"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tools = require("browserify-transform-tools");
const chalk = require("chalk");
const GulpLog_1 = require("./GulpLog");
function Requireify(alias, externals) {
    let replicant = {};
    for (let key in alias) {
        let trueKey = key.toLowerCase();
        replicant[trueKey] = 'require("' + alias[key] + '")';
    }
    for (let key in externals) {
        let trueKey = key.toLowerCase();
        if (replicant[trueKey]) {
            GulpLog_1.default(chalk.red('WARNING'), 'module import transform for', chalk.blue(trueKey), 'was defined for both', chalk.yellow('alias'), 'and', chalk.yellow('externals'));
        }
        replicant[trueKey] = 'window["' + externals[key] + '"]';
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
