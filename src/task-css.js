'use strict';

let gutil = require('gulp-util');
let sourcemaps = require('gulp-sourcemaps');

let sass = require('gulp-sass');
let gwatch = require('gulp-watch');

let toErrorHandler = require('./pipe/to-errorhandler');
let toSizeLog = require('./pipe/to-sizelog');
let toTimeLog = require('./pipe/to-timelog');

let toPostCss = require('./pipe/to-postcss');

module.exports = function (gulp, projectCssEntry, projectCssWatch, outputCssFolder, isProduction, watch, projectNpmFolder) {
    gulp.task('css:compile', function () {
        gutil.log('Compiling CSS', gutil.colors.cyan(projectCssEntry));

        let sassOptions = {
            includePaths: [projectNpmFolder]
        };

        return gulp.src(projectCssEntry)
            .pipe(toErrorHandler())
            .pipe(sourcemaps.init())
            .pipe(sass(sassOptions))
            .pipe(toPostCss(isProduction))
            .pipe(sourcemaps.write('./'))
            .pipe(toSizeLog())
            .pipe(toTimeLog('Finished CSS compilation after'))
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
