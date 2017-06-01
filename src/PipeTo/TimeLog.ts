import * as prettyTime from 'pretty-hrtime';
import * as through2 from 'through2';
import * as gutil from 'gulp-util';

let TimeLog = message => {
    let start = process.hrtime();
    let stream = through2.obj();

    return stream.once('end', () => {
        let time = prettyTime(process.hrtime(start));
        gutil.log(message, gutil.colors.green(time));
    });
};

export { TimeLog }
