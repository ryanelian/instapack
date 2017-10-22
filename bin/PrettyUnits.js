"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nanoUnitPrefix = ['n', 'µ', 'm'];
const bigUnitPrefix = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
function siDegree(x) {
    return Math.floor(Math.log10(x) / 3);
}
function prettyBytes(size) {
    let unit = siDegree(size);
    let scale = size * Math.pow(1000, -unit);
    return scale.toPrecision(3) + ' ' + bigUnitPrefix[unit] + 'B';
}
exports.prettyBytes = prettyBytes;
function prettySeconds(s) {
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
exports.prettySeconds = prettySeconds;
function prettyMilliseconds(ms) {
    if (ms < 1000) {
        return ms.toPrecision(3) + ' ms';
    }
    else {
        return prettySeconds(ms / 1000);
    }
}
exports.prettyMilliseconds = prettyMilliseconds;
function prettyHrTime(hrtime) {
    if (hrtime[0] === 0) {
        let unit = siDegree(hrtime[1]);
        let scale = hrtime[1] * Math.pow(1000, -unit);
        return scale.toPrecision(3) + ' ' + nanoUnitPrefix[unit] + 's';
    }
    else {
        let s = hrtime[0] + (hrtime[1] / Math.pow(1000, 3));
        return prettySeconds(s);
    }
}
exports.prettyHrTime = prettyHrTime;
