import chalk from 'chalk';
import * as upath from 'upath';

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
    for (let i = 0; i < tokens.length; i++) {
        message += ' ' + tokens[i];
    }
    return message;
}

const stackFrameParser = /^\s*(eval )?at (\S+) \((.+?)(, <anonymous>)?:(\d+):(\d+)\)$/;

export class StackFrame {

    isEval: boolean;

    isAnonymous: boolean;

    methodName: string;

    filePath: string;

    lineNumber: number;

    columnNumber: number;

    innerFrame: StackFrame;

    static parseFrame(line: string) {
        if (stackFrameParser.test(line)) {
            let parsed = stackFrameParser.exec(line);
            let frame = new StackFrame();

            frame.isEval = Boolean(parsed[1]);
            frame.methodName = parsed[2];

            let details = parsed[3];
            frame.innerFrame = this.parseFrame(details);
            if (!frame.innerFrame) {
                frame.filePath = upath.toUnix(details);
            }

            frame.isAnonymous = Boolean(parsed[4]);
            frame.lineNumber = parseInt(parsed[5]);
            frame.columnNumber = parseInt(parsed[6]);

            // console.log();
            // console.log(line);
            // console.log(JSON.stringify(frame, null, 2));

            return frame;
        } else {
            return null;
        }
    }

    static parseErrorStack(errorStack: string): StackFrame[] {
        let lines = errorStack.split('\n');
        lines.shift();

        let frames: StackFrame[] = [];

        for (let line of lines) {
            let frame = this.parseFrame(line);
            frames.push(frame);
        }

        return frames;
    }

    get shortFilePath() {
        let instapackRootFolder = upath.resolve(__dirname, '..');
        if (this.filePath.startsWith(instapackRootFolder) === false) {
            return this.filePath;
        }

        let s = '(instapack)';
        let fragments = upath.relative(instapackRootFolder, this.filePath).split('/');

        while (fragments[0] === 'node_modules') {
            s += `/(${fragments[1]})`;
            fragments.shift();
            fragments.shift();
        }

        for (let fragment of fragments) {
            s += '/' + fragment;
        }

        return s;
    }

    render(level: number = 1): string {
        let render = '';

        for (let i = 0; i < level * 2; i++) {
            render += ' ';
        }
        render += '- ';

        if (this.isEval) {
            render += chalk.yellow('eval') + ' ';
        }

        if (this.isAnonymous) {
            render += chalk.magenta('<anonymous>');
        } else if (this.filePath) {
            render += chalk.red(upath.basename(this.filePath));
        }

        render += chalk.grey(':') + chalk.green(this.lineNumber.toString());
        render += chalk.grey(':') + chalk.green(this.columnNumber.toString());

        render += ' ' + this.methodName;

        if (this.filePath) {
            render += '\n'
            for (let i = 0; i < level * 2 + 2; i++) {
                render += ' ';
            }
            render += chalk.grey(this.shortFilePath);
        }

        if (this.innerFrame) {
            render += '\n';
            render += this.innerFrame.render(level + 1);
        }

        return render;
    }
}

export let Shout = {
    timed: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = `[${chalk.grey(nowFormatted())}]` + message;
        console.log(output);
    },

    error: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk.red('ERROR') + message;
        console.error(output);
    },

    fatal: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk.red('FATAL ERROR') + message;
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

    stackTrace: function (error: Error) {
        let render: string;

        if (error['formatted']) {
            // for node-sass compile error
            render = chalk.red(error['formatted']);
        } else {
            render = chalk.bgRed(error.name) + ' ' + error.message;
            for (let frame of StackFrame.parseErrorStack(error.stack)) {
                render += '\n' + frame.render();
            }
        }

        console.error();
        console.error(render);
        console.error();
    }
};
