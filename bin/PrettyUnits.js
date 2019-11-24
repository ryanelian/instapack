"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nanoUnitPrefix = ['n', 'µ', 'm'];
const bigUnitPrefix = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
function siDegree(x) {
    return Math.floor(Math.log10(x) / 3);
}
exports.siDegree = siDegree;
function stringifyExponent(ordinal, scale) {
    if (ordinal < 1000) {
        return ordinal.toFixed().toString();
    }
    const firstThreeDigits = ordinal * Math.pow(1000, -scale);
    return firstThreeDigits.toPrecision(3).toString();
}
exports.stringifyExponent = stringifyExponent;
function prettyBytes(size) {
    const unit = siDegree(size);
    return stringifyExponent(size, unit) + ' ' + bigUnitPrefix[unit] + 'B';
}
exports.prettyBytes = prettyBytes;
function prettySeconds(s) {
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
exports.prettySeconds = prettySeconds;
function prettyMilliseconds(ms) {
    if (ms < 1000) {
        return ms.toFixed() + ' ms';
    }
    else {
        return prettySeconds(ms / 1000);
    }
}
exports.prettyMilliseconds = prettyMilliseconds;
function prettyHrTime(hrtime) {
    if (hrtime[0] === 0) {
        const unit = siDegree(hrtime[1]);
        return stringifyExponent(hrtime[1], unit) + ' ' + nanoUnitPrefix[unit] + 's';
    }
    else {
        const s = hrtime[0] + (hrtime[1] / Math.pow(1000, 3));
        return prettySeconds(s);
    }
}
exports.prettyHrTime = prettyHrTime;
