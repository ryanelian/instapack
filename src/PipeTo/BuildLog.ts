import * as prettyTime from 'pretty-hrtime';
import * as prettyBytes from 'pretty-bytes';
import * as through2 from 'through2';
import * as gutil from 'gulp-util';

/**
 * Creates a new build pipe for displaying the output files size and the elapsed time.
 * @param label 
 */
export function BuildLog(label: string) {
    let start = process.hrtime();

    let stream = through2.obj(function (chunk, enc, next) {

        if (chunk.isBuffer()) {
            let fileName = gutil.colors.blue(chunk.relative);
            let size = gutil.colors.magenta(prettyBytes(chunk.contents.length));
            gutil.log(fileName, size);
        } else {
            gutil.log(gutil.colors.red('Unexpected outputs: files are not buffered!'));
        }

        next(null, chunk);
    });

    stream.once('end', () => {
        let time = prettyTime(process.hrtime(start));
        gutil.log('Finished', label, 'after', gutil.colors.green(time));
    });

    return stream;
};
