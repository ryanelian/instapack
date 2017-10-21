import * as through2 from 'through2';
import chalk from 'chalk';
import glog from '../GulpLog';
import { prettyBytes, prettyHrTime } from '../PrettyUnits';

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
            let size = prettyBytes(chunk.contents.length);
            glog(chalk.blue(chunk.relative), chalk.magenta(size));
        }

        next(null, chunk);
    });

    stream.once('end', () => {
        let time = prettyHrTime(process.hrtime(start));
        glog('Finished', label, 'after', chalk.green(time));
    });

    return stream;
}
