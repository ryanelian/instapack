import * as through2 from 'through2';
import * as chalk from 'chalk';
import glog from '../GulpLog';

/**
 * Returns SI prefix scaled from number without prefix. 
 * @param unit 
 */
function bigUnitPrefix(unit: number) {
    switch (unit) {
        case 0: {
            return '';
        }
        case 1: {
            return 'k'; // kilo
        }
        case 2: {
            return 'M'; // mega
        }
        case 3: {
            return 'G'; // giga
        }
        case 4: {
            return 'T'; // tera
        }
        case 5: {
            return 'P'; // peta
        }
        case 6: {
            return 'E'; // exa
        }
        case 7: {
            return 'Z'; // zetta
        }
        case 8: {
            return 'Y'; // yotta
        }
        default: {
            return '?';
        }
    }
}

/**
 * Returns SI prefix scaled from nano-scale numbers.
 * @param unit 
 */
function nanoUnitPrefix(unit: number) {
    switch (unit) {
        case 0: {
            return 'n'; // nano
        }
        case 1: {
            return 'µ'; // micro
        }
        case 2: {
            return 'm'; // milli
        }
        default: {
            return '?';
        }
    }
}

/**
 * Returns byte formatted as string as SI unit.
 * @param hrtime 
 */
function prettyBytes(size: number) {
    let unit = 0;
    while (size > 1000) {
        size /= 1000.00;
        unit++;
    }
    return size.toPrecision(3) + ' ' + bigUnitPrefix(unit) + 'B';
}

/**
 * Returns node high-resolution time formatted as string with seconds as SI unit.
 * @param hrtime 
 */
function prettyTime(hrtime: [number, number]) {
    if (hrtime[0] === 0) {
        let size = hrtime[1];
        let unit = 0;
        while (size > 1000) {
            size /= 1000.00;
            unit++;
        }
        return size.toPrecision(3) + ' ' + nanoUnitPrefix(unit) + 's';
    } else {
        let t = hrtime[0] + (hrtime[1] / Math.pow(1000, 3));
        return t.toPrecision(3) + ' s';
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
