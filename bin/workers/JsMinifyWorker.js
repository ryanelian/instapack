"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
const UglifyJS = __importStar(require("uglify-js"));
module.exports = function (input, callback) {
    let minifyOptions = {
        compress: {
            collapse_vars: false,
            conditionals: false,
        }
    };
    if (input.map) {
        minifyOptions.sourceMap = {
            content: input.map
        };
    }
    let result = UglifyJS.minify({
        [input.fileName]: input.code
    }, minifyOptions);
    if (result.error) {
        callback(result.error);
    }
    else {
        callback(null, result);
    }
};
