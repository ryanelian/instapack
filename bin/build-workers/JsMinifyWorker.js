"use strict";
const UglifyJS = require("uglify-js");
module.exports = function (input, callback) {
    let result = UglifyJS.minify(input.payload, input.options);
    if (result.error) {
        callback(result.error);
    }
    else {
        callback(null, result);
    }
};
