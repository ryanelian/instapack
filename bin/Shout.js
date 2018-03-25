"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const upath = require("upath");
function padZeroToDoubleDigits(x) {
    let s = '';
    if (x < 10) {
        s += '0';
    }
    s += x;
    return s;
}
function nowFormatted() {
    let t = new Date();
    return padZeroToDoubleDigits(t.getHours()) + ':' + padZeroToDoubleDigits(t.getMinutes()) + ':' + padZeroToDoubleDigits(t.getSeconds());
}
function concatenateTokens(tokens) {
    let message = '';
    for (let i = 0; i < tokens.length; i++) {
        message += ' ' + tokens[i];
    }
    return message;
}
const stackFrameParser = /^\s*(eval )?at (\S+) \((.+?)(, <anonymous>)?:(\d+):(\d+)\)$/;
class StackFrame {
    static parseFrame(line) {
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
            return frame;
        }
        else {
            return null;
        }
    }
    static parseErrorStack(errorStack) {
        let lines = errorStack.split('\n');
        lines.shift();
        let frames = [];
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
    render(level = 1) {
        let render = '';
        for (let i = 0; i < level * 2; i++) {
            render += ' ';
        }
        render += '- ';
        if (this.isEval) {
            render += chalk_1.default.yellow('eval') + ' ';
        }
        if (this.isAnonymous) {
            render += chalk_1.default.magenta('<anonymous>');
        }
        else if (this.filePath) {
            render += chalk_1.default.red(upath.basename(this.filePath));
        }
        render += chalk_1.default.grey(':') + chalk_1.default.green(this.lineNumber.toString());
        render += chalk_1.default.grey(':') + chalk_1.default.green(this.columnNumber.toString());
        render += ' ' + this.methodName;
        if (this.filePath) {
            render += '\n';
            for (let i = 0; i < level * 2 + 2; i++) {
                render += ' ';
            }
            render += chalk_1.default.grey(this.shortFilePath);
        }
        if (this.innerFrame) {
            render += '\n';
            render += this.innerFrame.render(level + 1);
        }
        return render;
    }
}
exports.StackFrame = StackFrame;
exports.Shout = {
    timed: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = `[${chalk_1.default.grey(nowFormatted())}]` + message;
        console.log(output);
    },
    error: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk_1.default.red('ERROR') + message;
        console.error(output);
    },
    fatal: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk_1.default.red('FATAL ERROR') + message;
        console.error(output);
    },
    danger: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk_1.default.red('DANGER') + message;
        console.warn(output);
    },
    warning: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk_1.default.yellow('WARNING') + message;
        console.warn(output);
    },
    typescript: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk_1.default.blue('TypeScript') + message;
        console.log(output);
    },
    sass: function (...tokens) {
        let message = concatenateTokens(tokens);
        let output = chalk_1.default.magenta('Sass') + message;
        console.log(output);
    },
    stackTrace: function (error) {
        let render;
        if (error['formatted']) {
            render = chalk_1.default.red(error['formatted']);
        }
        else {
            render = chalk_1.default.bgRed(error.name) + ' ' + error.message;
            for (let frame of StackFrame.parseErrorStack(error.stack)) {
                render += '\n' + frame.render();
            }
        }
        console.error();
        console.error(render);
        console.error();
    }
};
