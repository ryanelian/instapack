"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gutil = require("gulp-util");
const uglifyjs = require("uglify-js");
const minifier = require("gulp-uglify/composer");
let MinifyProductionJs = productionMode => {
    let minify = minifier(uglifyjs, console);
    let minifyOptions = {};
    return productionMode ? minify(minifyOptions) : gutil.noop();
};
exports.MinifyProductionJs = MinifyProductionJs;
