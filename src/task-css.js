'use strict';

let sass = require('gulp-sass');
let gwatch = require('gulp-watch');
let sourcemaps = require('gulp-sourcemaps');
let gutil = require('gulp-util');
let duration = require('./gulp-duration');

let cssProcessors = require('./css-processors');
let sizing = require('./sizing');
let errortrap = require('./errortrap');

module.exports = function (gulp, projectCssEntry, projectCssWatch, outputCssFolder, isProduction, watch, projectNpmFolder) {
    gulp.task('css:compile', function () {
        gutil.log('Compiling CSS', gutil.colors.cyan(projectCssEntry));

        let sassOptions = {
            includePaths: [projectNpmFolder]
        };

        return gulp.src(projectCssEntry)
            .pipe(errortrap())
            .pipe(sourcemaps.init())
            .pipe(sass(sassOptions))
            .pipe(cssProcessors(isProduction))
            .pipe(sourcemaps.write('./'))
            .pipe(sizing())
            .pipe(duration('Finished CSS compilation after'))
            .pipe(gulp.dest(outputCssFolder));
    });

    gulp.task('css', ['css:compile'], function () {
        if (watch) {
            return gwatch(projectCssWatch, function () {
                gulp.start('css:compile');
            });
        }
    });
};
