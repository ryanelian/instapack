import chalk = require('chalk');
import * as upath from 'upath';
import * as fse from 'fs-extra';
import { prettyBytes } from './PrettyUnits';

/**
 * Converts a number into a string. If the number is less than 10, adds 0 as prefix.
 * @param x 
 */
function padZeroToDoubleDigits(x: number): string {
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
function nowFormatted(): string {
    const t = new Date();
    return padZeroToDoubleDigits(t.getHours()) + ':' + padZeroToDoubleDigits(t.getMinutes()) + ':' + padZeroToDoubleDigits(t.getSeconds());
}

function concatenateTokens(tokens: unknown[]): string {
    let message = '';
    for (const token of tokens) {
        if (token instanceof Error) {
            if (token.stack) {
                message += '\n' + chalk.redBright(token.stack);
            } else {
                message += '\n' + chalk.redBright(token.toString());
            }
        } else {
            message += ' ' + token;
        }
    }
    return message;
}

export const Shout = {

    timed: function (...tokens: unknown[]): void {
        const message = concatenateTokens(tokens);
        const output = `[${chalk.grey(nowFormatted())}]` + message;
        console.log(output);
    },

    error: function (...tokens: unknown[]): void {
        const message = concatenateTokens(tokens);
        const output = '\n' + chalk.redBright('ERROR') + message + '\n';
        console.error(output);
    },

    fatal: function (...tokens: unknown[]): void {
        const message = concatenateTokens(tokens);
        const output = '\n' + chalk.redBright('FATAL ERROR') + message + '\n';
        console.error(output);
    },

    warning: function (...tokens: unknown[]): void {
        const message = concatenateTokens(tokens);
        const output = chalk.yellowBright('WARNING') + message;
        console.warn(output);
    },

    typescript: function (...tokens: unknown[]): void {
        const message = concatenateTokens(tokens);
        const output = chalk.blueBright('TypeScript') + message;
        console.log(output);
    },

    sass: function (...tokens: unknown[]): void {
        const message = concatenateTokens(tokens);
        const output = chalk.magentaBright('Sass') + message;
        console.log(output);
    },

    /**
     * Logs file output and writes to output directory as a UTF-8 encoded string.
     * @param filePath 
     * @param content 
     */
    fileOutput(filePath: string, content: string): Promise<void> {
        const bundle = Buffer.from(content, 'utf8');
        const info = upath.parse(filePath);
        const size = prettyBytes(bundle.byteLength);

        Shout.timed(chalk.blueBright(info.base), chalk.magentaBright(size), chalk.grey('in ' + info.dir + '/'));
        return fse.outputFile(filePath, bundle);
    }
};
