import chalk from 'chalk';
import * as upath from 'upath';

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
