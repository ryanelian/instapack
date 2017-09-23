import { ModuleAliases } from './Settings';
import * as tools from 'browserify-transform-tools';

/**
 * Returns a deep alias transform for Browserify, using a key-value map object parameter.
 * @param options 
 */
export default function Aliasify(options: ModuleAliases) {
    return tools.makeRequireTransform('aliasify', function (args, context, cb) {
        let key = args[0];
        let value = options[key];
        // console.log(key + ' ' + value);
        if (value) {
            return cb(null, 'require("' + value + '")');
        } else {
            return cb();
        }
    });
}
