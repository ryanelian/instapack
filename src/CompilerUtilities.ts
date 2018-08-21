import chalk from 'chalk';
import * as upath from 'upath';
import * as fse from 'fs-extra';
import * as WorkerFarm from 'worker-farm';
import * as net from 'net';

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

/**
 * Sort an map-like object by its keys.
 * @param input 
 */
export function objectSortByKeys(input) {
    let output: any = {};

    let keys = Object.keys(input).sort();
    for (let key of keys) {
        output[key] = input[key];
    }

    return output;
}

/**
 * Merge existing project package.json with incoming template package.json 
 * by overriding instapack setting and package versions. (Keep the rest intact)
 * @param projectPackageJson 
 * @param templatePackageJson 
 */
export function mergePackageJson(projectPackageJson, templatePackageJson) {
    let packageJson = JSON.parse(JSON.stringify(projectPackageJson));

    if (templatePackageJson.instapack) {
        packageJson.instapack = templatePackageJson.instapack;
    }

    if (!packageJson.dependencies) {
        packageJson.dependencies = {};
    }

    if (!packageJson.devDependencies) {
        packageJson.devDependencies = {};
    }

    if (templatePackageJson.dependencies) {
        for (let packageName in templatePackageJson.dependencies) {
            if (packageJson.devDependencies[packageName]) {
                // override version of existing package in dev dependencies
                packageJson.devDependencies[packageName] = templatePackageJson.dependencies[packageName];
            } else {
                packageJson.dependencies[packageName] = templatePackageJson.dependencies[packageName];
            }
        }
    }

    if (templatePackageJson.devDependencies) {
        for (let packageName in templatePackageJson.devDependencies) {
            if (packageJson.dependencies[packageName]) {
                // override version of existing package in normal dependencies
                packageJson.dependencies[packageName] = templatePackageJson.devDependencies[packageName];
            } else {
                packageJson.devDependencies[packageName] = templatePackageJson.devDependencies[packageName];
            }
        }
    }

    packageJson.dependencies = objectSortByKeys(packageJson.dependencies);
    packageJson.devDependencies = objectSortByKeys(packageJson.devDependencies);
    return packageJson;
}

/**
 * Check if a port number is available
 * @param port 
 */
export function isPortAvailable(port: number) {
    return new Promise<boolean>((ok, reject) => {
        let tester = net
            .createServer()
            .once('error', function (err) {
                // console.log(`Port ${port} is not available!`);
                ok(false);
            })
            .once('listening', function () {
                // console.log(`Port ${port} is available!`);
                tester.once('close', function () {
                    ok(true);
                }).close();
            })
            .listen({
                host: 'localhost',
                port: port,
                exclusive: true
            });
    });
}

/**
 * Get any open port, ranging from input port number
 * @param startFrom 
 */
export async function getAvailablePort(startFrom: number) {
    let i = startFrom;
    while (await isPortAvailable(i) === false) {
        i++;
        if (i > 49151) {
            //  49152 up to 65535 are reserved for Ephemeral ports
            throw new Error('Cannot find an open port!');
        }
    }

    return i;
}
