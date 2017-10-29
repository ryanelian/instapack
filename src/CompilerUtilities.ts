import chalk from 'chalk';
import * as path from 'path';
import * as fse from 'fs-extra';

import { prettyBytes } from './PrettyUnits';

/**
 * Defines build flags to be used by Compiler class.
 */
export interface CompilerFlags {
    production: boolean,
    watch: boolean,
    sourceMap: boolean,
    parallel: boolean
}

/**
 * Converts a number into a string. If the number is less than 10, adds 0 as prefix.
 * @param x 
 */
function padZeroToDoubleDigits(x: number) {
    let s = '';
    if (x < 10) {
        s += '0';
    }
    s += x;
    return s;
}

/**
 * Returns the current time, formatted to HHMMSS string.
 */
function nowFormatted() {
    let t = new Date();
    return padZeroToDoubleDigits(t.getHours()) + ':' + padZeroToDoubleDigits(t.getMinutes()) + ':' + padZeroToDoubleDigits(t.getSeconds());
}

/**
 * Compatibility shim for gulp-util log method.
 * @param tokens 
 */
export function timedLog(...tokens: any[]) {
    let output = '[' + chalk.grey(nowFormatted()) + ']';
    for (let i = 0; i < tokens.length; i++) {
        output += ' ' + tokens[i];
    }
    console.log(output);
}

/**
 * Logs file output and writes to output directory as a UTF-8 encoded string.
 * @param filePath 
 * @param content 
 */
export function logAndWriteUtf8FileAsync(filePath: string, content: string) {
    let bundle = Buffer.from(content, 'utf8');
    let name = path.basename(filePath)
    let size = prettyBytes(bundle.byteLength);

    timedLog(chalk.blue(name), chalk.magenta(size));
    return fse.outputFile(filePath, bundle);
}

/**
 * Accepts absolute path and returns a source-map friendly path relative to that object.
 * This will probably break for stuffs outside the root project folder, but whatever...
 * @param s 
 */
export function convertAbsoluteToSourceMapPath(root: string, s: string) {
    return '/./' + path.relative(root, s).replace(/\\/g, '/');
}