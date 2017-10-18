import * as through2 from 'through2';
import chalk from 'chalk';
import glog from '../GulpLog';

const bigUnitPrefix = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
const nanoUnitPrefix = ['n', 'µ', 'm'];

/**
 * Returns number scale in multiples of 10e3 in O(1) complexity.
 * @param x 
 */
function siDegree(x: number) {
    return Math.floor(Math.log10(x) / 3);
}

/**
 * Returns byte formatted as string with SI prefix.
 * @param size 
 */
function prettyBytes(size: number) {
    let unit = siDegree(size);
    let scale = size * Math.pow(1000, -unit);
    return scale.toPrecision(3) + ' ' + bigUnitPrefix[unit] + 'B';
}

/**
 * Returns node high-resolution time formatted as string with SI prefix and hours-minutes-seconds formatting.
 * @param hrtime 
 */
function prettyHrTime(hrtime: [number, number]) {
    if (hrtime[0] === 0) {
        let unit = siDegree(hrtime[1]);
        let scale = hrtime[1] * Math.pow(1000, -unit);
        return scale.toPrecision(3) + ' ' + nanoUnitPrefix[unit] + 's';
    } else {
        let s = hrtime[0] + (hrtime[1] / Math.pow(1000, 3));

        let h = Math.floor(s / 3600);
        s -= h * 3600;
        let m = Math.floor(s / 60);
        s -= m * 60;

        let result = s.toPrecision(3) + ' s';
        if (m) {
            result = m + ' min ' + result;
        }
        if (h) {
            result = h + ' h ' + result;
        }

        return result;
    }
}

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
