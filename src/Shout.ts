import chalk from 'chalk';
import * as notifier from 'node-notifier';
import * as path from 'path';

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

function concatenateTokens(tokens: any[]) {
    let message = '';
    for (let token of tokens) {
        if (token instanceof Error) {
            message += '\n' + chalk.red(token.stack);
            // render = chalk.bgRed(error.name) + ' ' + error.message;
            // for (let frame of StackFrame.parseErrorStack(error.stack)) {
            //     render += '\n' + frame.render();
            // }
        } else {
            message += ' ' + token;
        }
    }
    return message;
}

export let Shout = {

    enableNotification: false,

    timed: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = `[${chalk.grey(nowFormatted())}]` + message;
        console.log(output);
    },

    error: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = '\n' + chalk.red('ERROR') + message + '\n';
        console.error(output);
    },

    fatal: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = '\n' + chalk.red('FATAL ERROR') + message + '\n';
        console.error(output);
    },

    danger: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk.red('DANGER') + message;
        console.warn(output);
    },

    warning: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk.yellow('WARNING') + message;
        console.warn(output);
    },

    typescript: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk.blue('TypeScript') + message;
        console.log(output);
    },

    sass: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk.magenta('Sass') + message;
        console.log(output);
    },

    notify: function (...tokens) {
        if (!this.enableNotification) {
            return;
        }

        let message = '...';
        let icon = path.join(__dirname, '../img/madobe.png');
        if (tokens && tokens.length) {
            message = concatenateTokens(tokens);
        }

        notifier.notify({
            title: 'instapack',
            message,
            icon,
            sound: false
        });
    }
};
