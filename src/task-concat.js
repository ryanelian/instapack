'use strict';

let gutil = require('gulp-util');

let concat = require('gulp-concat');
let es = require('event-stream');

let toSizeLog = require('./pipe/to-sizelog');
let toTimeLog = require('./pipe/to-timelog');

let toProductionJsMinifier = require('./pipe/to-miniprod');

module.exports = function (gulp, concatFiles, outputJsFolder, isProduction) {
    gulp.task('concat', function () {
        let concatStreams = [];
        for (let target in concatFiles) {
            let targetFiles = concatFiles[target];
            let targetStream = gulp.src(targetFiles).pipe(concat(target));
            concatStreams.push(targetStream);
        }

        gutil.log('Resolved', gutil.colors.cyan(concatStreams.length), 'concatenation targets.');
        if (!concatStreams.length) {
            return;
        }

        return es.merge(concatStreams)
            .pipe(toProductionJsMinifier(isProduction))
            .pipe(toSizeLog())
            .pipe(toTimeLog('Finished JS concatenation after'))
            .pipe(gulp.dest(outputJsFolder));
    });
};
