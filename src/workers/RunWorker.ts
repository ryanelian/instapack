import WorkerFarm = require('worker-farm');
import { BuildVariables } from '../variables-factory/BuildVariables';

const typeScriptBuildWorkerModulePath = require.resolve('./TypeScriptBuildWorker');
const typeScriptCheckWorkerModulePath = require.resolve('./TypeScriptCheckWorker');
const sassBuildWorkerModulePath = require.resolve('./SassBuildWorker');
const copyBuildWorkerModulePath = require.resolve('./CopyBuildWorker');

/**
 * Runs worker in separate process, returns Promise.
 * Automatically end the worker when it is finished.
 * @param modulePath 
 * @param params 
 */
export async function runWorkerAsync<T>(modulePath: string, params): Promise<T> {
    const worker = WorkerFarm(modulePath);
    try {
        const p = new Promise<T>((ok, reject) => {
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

export function runTypeScriptBuildWorker(variables: BuildVariables): Promise<void> {
    return runWorkerAsync<void>(typeScriptBuildWorkerModulePath, variables);
}

export function runTypeScriptCheckWorker(variables: BuildVariables): Promise<void> {
    return runWorkerAsync<void>(typeScriptCheckWorkerModulePath, variables);
}

export function runSassBuildWorker(variables: BuildVariables): Promise<void> {
    return runWorkerAsync<void>(sassBuildWorkerModulePath, variables);
}

export function runCopyBuildWorker(variables: BuildVariables): Promise<void> {
    return runWorkerAsync<void>(copyBuildWorkerModulePath, variables);
}