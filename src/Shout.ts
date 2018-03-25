import chalk from "chalk";

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

function concatenateTokens(...tokens){
    let message = '';
    for (let i = 0; i < tokens.length; i++) {
        message += ' ' + tokens[i];
    }
    return message;
}

export let Shout = {
    timed: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = `[${chalk.grey(nowFormatted())}]${message}`;
        console.log(output);
    },

    error: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = `[${chalk.red('ERROR')}]${message}`;
        console.log(output);
    },

    fatal: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = `[${chalk.red('FATAL ERROR')}]${message}`;
        console.log(output);
    },

    danger: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = `[${chalk.red('DANGER')}]${message}`;
        console.log(output);
    },

    warning: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = `[${chalk.yellow('WARNING')}]${message}`;
        console.log(output);
    },
};
