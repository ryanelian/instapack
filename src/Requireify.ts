import * as tools from 'browserify-transform-tools';
import * as chalk from 'chalk';
import glog from './GulpLog';
import { ModuleOverrides } from './Settings';

/**
 * Returns a require transform for Browserify, using a key-value map object parameters (alias and externals).
 * @param alias 
 * @param externals 
 */
export default function Requireify(alias: ModuleOverrides, externals: ModuleOverrides) {
    let replicant = {};

    for (let key in alias) {
        let trueKey = key.toLowerCase();
        replicant[trueKey] = 'require("' + alias[key] + '")';
    }

    for (let key in externals) {
        let trueKey = key.toLowerCase();

        if (replicant[trueKey]) {
            glog(chalk.red('WARNING'), 'module import transform for', chalk.blue(trueKey),
                'was defined for both', chalk.yellow('alias'), 'and', chalk.yellow('externals'));
        }

        replicant[trueKey] = 'window["' + externals[key] + '"]';
    }

    // console.log(replicant);

    return tools.makeRequireTransform('requireify', function (args, context, cb) {
        let key = args[0] as string;
        if (!key) {
            return cb(); // error trap
        }

        let value = replicant[key.toLowerCase()];
        // console.log(key + ' ' + value);
        if (value) {
            return cb(null, value);
        } else {
            return cb();
        }
    });
}
