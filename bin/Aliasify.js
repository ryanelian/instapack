"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tools = require("browserify-transform-tools");
function Aliasify(options) {
    return tools.makeRequireTransform('aliasify', function (args, context, cb) {
        let key = args[0];
        let value = options[key];
        if (value) {
            return cb(null, 'require("' + value + '")');
        }
        else {
            return cb();
        }
    });
}
exports.default = Aliasify;
