import * as prettyTime from 'pretty-hrtime';
import * as prettyBytes from 'pretty-bytes';
import * as through2 from 'through2';
import * as chalk from 'chalk';
import glog from '../GulpLog';

/**
 * Creates a new build pipe for displaying the output files size and the elapsed time.
 * @param label 
 */
export function BuildLog(label: string) {
    let start = process.hrtime();

    let stream = through2.obj(function (chunk, enc, next) {
        if (chunk.isStream()) {
            let error = new Error('BuildLog: Streaming is not supported!');
            return next(error);
        }

        if (chunk.isBuffer()) {
            let fileName = chalk.blue(chunk.relative);
            let size = chalk.magenta(prettyBytes(chunk.contents.length));
            glog(fileName, size);
        }

        next(null, chunk);
    });

    stream.once('end', () => {
        let time = prettyTime(process.hrtime(start));
        glog('Finished', label, 'after', chalk.green(time));
    });

    return stream;
};
