"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const upath = require("upath");
const stackFrameParser = /^\s*(eval )?at ((?:new )?\S+) (?:\[as handler\] )?\((.+?)(, <anonymous>)?:(\d+):(\d+)\)$/;
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
            if (frame) {
                frames.push(frame);
            }
            else {
                console.warn('Cannot render an Error Frame, please file an issue to instapack at GitHub: ');
                console.warn(line);
            }
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
    render(level = 0) {
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
