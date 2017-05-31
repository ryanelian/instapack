'use strict';

let uglifyjs = require('uglify-js');
let gutil = require('gulp-util');
let minifier = require('gulp-uglify/composer');

module.exports = function (isProduction) {
    let minify = minifier(uglifyjs, console);
    let minifyOptions = {};
    return isProduction ? minify(minifyOptions) : gutil.noop();
};
