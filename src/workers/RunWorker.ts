import WorkerFarm = require('worker-farm');
import { IVariables } from '../variables-factory/IVariables';

const typeScriptBuildWorkerModulePath = require.resolve('./TypeScriptBuildWorker');
const typeScriptCheckWorkerModulePath = require.resolve('./TypeScriptCheckWorker');
const sassBuildWorkerModulePath = require.resolve('./SassBuildWorker');

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

export function runTypeScriptBuildWorker(variables: IVariables) {
    return runWorkerAsync<void>(typeScriptBuildWorkerModulePath, variables);
}

export function runTypeScriptCheckWorker(variables: IVariables) {
    return runWorkerAsync<void>(typeScriptCheckWorkerModulePath, variables);
}

export function runSassBuildWorker(variables: IVariables) {
    return runWorkerAsync<void>(sassBuildWorkerModulePath, variables);
}
