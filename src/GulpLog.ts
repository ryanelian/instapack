import * as chalk from 'chalk';

/**
 * Converts a number into a string. If the number is less than 10, adds 0 as prefix.
 * @param x 
 */
function padZeroToDoubleDigits(x: number) {
    let s = '';
    if (x < 10){
        s += '0';
    }
    s += x;
    return s;
}

/**
 * Returns the current time, formatted to HHMMSS string.
 */
function nowFormatted(){
    let t = new Date();
    return padZeroToDoubleDigits(t.getHours()) + ':' + padZeroToDoubleDigits(t.getMinutes()) + ':' + padZeroToDoubleDigits(t.getSeconds());
}

/**
 * Compatibility shim for gulp-util log method.
 * @param tokens 
 */
export default function GulpLog(...tokens: any[]) {
    let output = '[' + chalk.grey(nowFormatted()) + ']';
    for (let i = 0; i < tokens.length; i++) {
        output += ' ' + tokens[i];
    }
    console.log(output);
}
