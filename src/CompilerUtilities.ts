import chalk from 'chalk';
import * as upath from 'upath';
import * as fse from 'fs-extra';

import { prettyBytes } from './PrettyUnits';
import { Shout } from './Shout';

/**
 * Defines build flags to be used by Compiler class.
 */
export interface ICompilerFlags {
    production: boolean;
    watch: boolean;
    sourceMap: boolean;
    stats: boolean;
    notification?: boolean;
}

/**
 * Logs file output and writes to output directory as a UTF-8 encoded string.
 * @param filePath 
 * @param content 
 */
export function outputFileThenLog(filePath: string, content: string) {
    let bundle = Buffer.from(content, 'utf8');
    let info = upath.parse(filePath);
    let size = prettyBytes(bundle.byteLength);

    Shout.timed(chalk.blue(info.base), chalk.magenta(size), chalk.grey('in ' + info.dir + '/'));
    return fse.outputFile(filePath, bundle);
}
