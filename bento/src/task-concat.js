'use strict';

let gutil = require('gulp-util');
let miniprod = require('./miniprod');
let sizing = require('./sizing');
let duration = require('./gulp-duration');

let es = require('event-stream');
let concat = require('gulp-concat');

module.exports = function (gulp, concatFiles, outputJsFolder, isProduction) {
    gulp.task('concat', function () {
        let concatStreams = [];
        for (let target in concatFiles) {
            let targetFiles = concatFiles[target];
            let targetStream = gulp.src(targetFiles).pipe(concat(target));
            concatStreams.push(targetStream);
        }

        gutil.log('Found', gutil.colors.cyan(concatStreams.length), 'concatenation targets.');

        return es.merge(concatStreams)
            .pipe(miniprod(isProduction))
            .pipe(sizing())
            .pipe(duration('Finished JS concatenation after'))
            .pipe(gulp.dest(outputJsFolder));
    });
};
