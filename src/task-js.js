'use strict';

let gutil = require('gulp-util');
let sourcemaps = require('gulp-sourcemaps');

let browserify = require('browserify');
let tsify = require('tsify');
let watchify = require('watchify');
let htmlify = require('./htmlify');

let toErrorHandler = require('./pipe/to-errorhandler');
let toSizeLog = require('./pipe/to-sizelog');
let toTimeLog = require('./pipe/to-timelog');

let toProductionJsMinifier = require('./pipe/to-miniprod');
let toVinyl = require('./pipe/to-vinyl');
let toBuffer = require('./pipe/to-buffer');

module.exports = function (gulp, projectJsEntry, outputJsFolder, isProduction, watch) {
    let browserifyOptions = {
        debug: true,
        fast: true
    };

    if (watch) {
        browserifyOptions.cache = {};
        browserifyOptions.packageCache = {};
    }

    let bundler = browserify(browserifyOptions).transform(htmlify).add(projectJsEntry).plugin(tsify);

    bundler.compile = function () {
        gutil.log('Compiling JS', gutil.colors.cyan(projectJsEntry));

        return bundler.bundle()
            .on('error', gutil.log)
            .pipe(toVinyl('bundle.js'))
            .pipe(toBuffer())
            .pipe(toErrorHandler())
            .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(toProductionJsMinifier(isProduction))
            .pipe(sourcemaps.write('./'))
            .pipe(toSizeLog())
            .pipe(toTimeLog('Finished JS compilation after'))
            .pipe(gulp.dest(outputJsFolder));
    };

    if (watch) {
        bundler.plugin(watchify);
        bundler.on('update', bundler.compile);
    }

    gulp.task('js', bundler.compile);
};
