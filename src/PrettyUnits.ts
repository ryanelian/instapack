const nanoUnitPrefix = ['n', 'µ', 'm'];
const bigUnitPrefix = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];

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
export function prettyBytes(size: number) {
    let unit = siDegree(size);
    let scale = size * Math.pow(1000, -unit);
    return scale.toPrecision(3) + ' ' + bigUnitPrefix[unit] + 'B';
}

/**
 * Return large seconds as hours-minutes-seconds formatted string.
 * @param s 
 */
export function prettySeconds(s: number) {
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

/**
 * Returns large milliseconds as pretty seconds or simply add trailing `ms` for smaller value.
 * @param ms 
 */
export function prettyMilliseconds(ms: number) {
    if (ms < 1000) {
        return ms + ' ms';
    } else {
        return prettySeconds(ms / 1000);
    }
}

/**
 * Returns node high-resolution time formatted as string with SI prefix and hours-minutes-seconds formatting.
 * @param hrtime 
 */
export function prettyHrTime(hrtime: [number, number]) {
    if (hrtime[0] === 0) {
        let unit = siDegree(hrtime[1]);
        let scale = hrtime[1] * Math.pow(1000, -unit);
        return scale.toPrecision(3) + ' ' + nanoUnitPrefix[unit] + 's';
    } else {
        let s = hrtime[0] + (hrtime[1] / Math.pow(1000, 3));
        return prettySeconds(s);
    }
}