'use strict';

let uglifyjs = require('uglify-js');
let gulpif = require('gulp-if');
let minifier = require('gulp-uglify/composer');

module.exports = function (isProduction) {
    let minify = minifier(uglifyjs, console);
    let minifyOptions = {};
    return gulpif(isProduction, minify(minifyOptions));
};
