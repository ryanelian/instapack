import chalk from 'chalk';
import notifier = require('node-notifier');
import * as upath from 'upath';
import * as fse from 'fs-extra';
import { prettyBytes } from './PrettyUnits';

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
            if (token.stack) {
                message += '\n' + chalk.red(token.stack);
            } else {
                message += '\n' + chalk.red(token.toString());
            }
        } else {
            message += ' ' + token;
        }
    }
    return message;
}

export let Shout = {

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

    enableNotification: true,

    displayVerboseOutput: false,

    notify: function (...tokens) {
        if (!this.enableNotification) {
            return;
        }

        let message = '...';
        let icon = upath.join(__dirname, '../img/madobe.png');
        if (tokens && tokens.length) {
            message = concatenateTokens(tokens);
        }

        notifier.notify({
            title: 'instapack',
            message,
            icon,
            sound: false
        });
    },

    /**
     * Logs file output and writes to output directory as a UTF-8 encoded string.
     * @param filePath 
     * @param content 
     */
    fileOutput(filePath: string, content: string) {
        let bundle = Buffer.from(content, 'utf8');
        let info = upath.parse(filePath);
        let size = prettyBytes(bundle.byteLength);

        Shout.timed(chalk.blue(info.base), chalk.magenta(size), chalk.grey('in ' + info.dir + '/'));
        return fse.outputFile(filePath, bundle);
    }
};
