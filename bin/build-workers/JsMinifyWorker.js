"use strict";
const UglifyJS = require("uglify-js");
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
