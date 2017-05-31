'use strict';

let postcss = require('gulp-postcss');
let autoprefixer = require('autoprefixer');
let cssnano = require('cssnano');

let nanoOptions = {
    discardComments: {
        removeAll: true
    }
};

module.exports = function (isProduction) {
    let cssProcessors = [
        autoprefixer({
            browsers: ['ie >= 9', 'Android >= 4', 'last 3 versions']
        })
    ];

    if (isProduction) {
        cssProcessors.push(cssnano(nanoOptions));
    }

    return postcss(cssProcessors);
};
