import chalk from 'chalk';
import * as upath from 'upath';
import * as fse from 'fs-extra';
import * as WorkerFarm from 'worker-farm';

import { prettyBytes } from './PrettyUnits';
import { Shout } from './Shout';

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

/**
 * Runs worker in separate process, returns Promise.
 * Automatically end the worker when it is finished.
 * @param modulePath 
 * @param params 
 */
export async function runWorkerAsync<T>(modulePath: string, params) {
    let worker = WorkerFarm(modulePath);
    try {
        let p = new Promise<T>((ok, reject) => {
            worker(params, (error, result: T) => {
                if (error) {
                    reject(error)
                } else {
                    ok(result);
                }
            });
        });
        return await p;
    } finally {
        WorkerFarm.end(worker);
    }
}
