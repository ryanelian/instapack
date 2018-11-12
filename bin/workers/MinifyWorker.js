"use strict";
const uglify_js_1 = require("uglify-js");
const Terser = require("terser");
module.exports = function (input, callback) {
    let minifyOptions = {};
    if (input.map) {
        minifyOptions.sourceMap = {
            content: input.map
        };
    }
    let result;
    if (input.ecma === 5) {
        minifyOptions.compress = {
            collapse_vars: false,
            conditionals: false,
        };
        result = uglify_js_1.minify({
            [input.fileName]: input.code
        }, minifyOptions);
    }
    else {
        let terserOptions = minifyOptions;
        terserOptions.ecma = input.ecma;
        result = Terser.minify({
            [input.fileName]: input.code
        }, terserOptions);
    }
    if (result.error) {
        callback(result.error);
    }
    else {
        callback(null, result);
    }
};
