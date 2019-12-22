const nanoUnitPrefix = ['n', 'µ', 'm'];
const bigUnitPrefix = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];

/**
 * Returns number scale in multiples of 10e3 in O(1) complexity.
 * @param x 
 */
export function siDegree(x: number): number {
    return Math.floor(Math.log10(x) / 3);
}

export function stringifyExponent(ordinal: number, scale: number): string {
    if (ordinal < 1000) {
        return ordinal.toFixed().toString();
    }

    const firstThreeDigits = ordinal * Math.pow(1000, -scale);
    return firstThreeDigits.toPrecision(3).toString();
}

/**
 * Returns byte formatted as string with SI prefix.
 * @param size 
 */
export function prettyBytes(size: number): string {
    const unit = siDegree(size);
    return stringifyExponent(size, unit) + ' ' + bigUnitPrefix[unit] + 'B';
}

/**
 * Return large seconds as hours-minutes-seconds formatted string.
 * @param s 
 */
export function prettySeconds(s: number): string {
    const h = Math.floor(s / 3600);
    s -= h * 3600;
    const m = Math.floor(s / 60);
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
export function prettyMilliseconds(ms: number): string {
    if (ms < 1000) {
        return ms.toFixed() + ' ms';
    } else {
        return prettySeconds(ms / 1000);
    }
}

/**
 * Returns node high-resolution time formatted as string with SI prefix and hours-minutes-seconds formatting.
 * @param hrtime 
 */
export function prettyHrTime(hrtime: [number, number]): string {
    if (hrtime[0] === 0) {
        const unit = siDegree(hrtime[1]);
        return stringifyExponent(hrtime[1], unit) + ' ' + nanoUnitPrefix[unit] + 's';
    } else {
        const s = hrtime[0] + (hrtime[1] / Math.pow(1000, 3));
        return prettySeconds(s);
    }
}
