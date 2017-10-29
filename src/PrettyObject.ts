import chalk from 'chalk';
import { Chalk } from 'chalk';

/**
 * Contain methods for creating a colored and formatted string representation of an object to CLI output.
 */
export class PrettyObject {
    /**
     * Gets the coloring chalk for field names and symbols.
     */
    readonly symbolChalk: Chalk;

    /**
     * Gets the coloring chalk for number or boolean value types.
     */
    readonly ordinalChalk: Chalk;

    /**
     * Gets the coloring chalk for string value types.
     */
    readonly stringChalk: Chalk;

    /**
     * Gets the coloring chalk for null or undefined value types.
     */
    readonly nullChalk: Chalk;

    /**
     * Constructs a pretty renderer using selected color for display components. 
     * @param symbolColor 
     * @param ordinalColor 
     * @param stringColor 
     * @param nullColor 
     */
    constructor(symbolColor = 'red', ordinalColor = 'green', stringColor = 'whiteBright', nullColor = 'gray') {
        this.symbolChalk = chalk[symbolColor];
        this.ordinalChalk = chalk[ordinalColor];
        this.stringChalk = chalk[stringColor];
        this.nullChalk = chalk[nullColor];
    }

    /**
     * Returns true if parameter is actually an object or array!
     * @param o 
     */
    isObject(o) {
        return (o !== null) && (o !== undefined) && (typeof o === 'object');
    }

    /**
     * Returns true if parameter is a function!
     * @param o 
     */
    isFunction(o) {
        return (typeof o === 'function');
    }

    /**
     * Returns spacing to next object render depending on its type. 
     * @param o 
     */
    getPropertySpacer(o) {
        if (this.isObject(o)) {
            if (Object.keys(o).length === 0) return '';
            return '\n';
        } else {
            return ' ';
        }
    }

    /**
     * Gets left indentation for nested object rendering level.
     * @param level 
     */
    getLevelSpacer(level: number) {
        let s = '';
        for (let i = 0; i < level; i++) {
            s += '  ';
        }
        return s;
    }

    /**
     * Detects whether an object is Sass Error.
     * @param o 
     */
    isSassError(o): boolean {
        return (o instanceof Error) && o['formatted'];
    }

    /**
     * Recursively converts an object to its string representative, with colors for command line interface.
     * @param o 
     * @param level 
     */
    render(o, level = 0): string {
        if (o === undefined) {
            return this.nullChalk('undefined');
        } else if (o === null) {
            return this.nullChalk('null');
        } else if (typeof o === 'string') {
            return this.stringChalk(o);
        } else if (Array.isArray(o)) {
            let result = [];
            for (let e of o) {
                if (this.isFunction(e)) {
                    continue;
                }

                let line = '';
                line += this.getLevelSpacer(level);
                line += this.symbolChalk('-');
                line += this.getPropertySpacer(e);
                line += this.render(e, level + 1);
                result.push(line);
            }
            return result.join('\n');
        } else if (typeof o === 'object') {
            if (this.isSassError(o)) {
                return chalk.red(o['formatted'] as string);
            }

            let result = [];
            for (let key of Object.keys(o).sort()) {
                if (this.isFunction(o[key])) {
                    // Prevents puking out function codes!
                    continue;
                }

                let line = '';
                line += this.getLevelSpacer(level);
                line += this.symbolChalk(key + ':');
                line += this.getPropertySpacer(o[key]);
                line += this.render(o[key], level + 1);
                result.push(line);
            }

            return result.join('\n');
        } else if (typeof (o) === 'number' || typeof (o) === 'boolean') {
            return this.ordinalChalk(o.toString());
        } else {
            return '';
        }
    }
}

let p = new PrettyObject();
export default p;

/**
 * Returns a formatted error.
 * @param error 
 */
export function prettyError(error: Error) {
    try {
        return p.render(error);
    } catch {
        return chalk.red(error as any);
    }
}
