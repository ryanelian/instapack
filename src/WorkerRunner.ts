import WorkerFarm from 'worker-farm';
import { IVariables } from './interfaces/IVariables';
import { MinifyOutput } from 'uglify-js';
import { IMinifyInputs } from './interfaces/IMinifyInputs';

const typeScriptBuildWorkerModulePath = require.resolve('./workers/TypeScriptBuildWorker');
const typeScriptCheckWorkerModulePath = require.resolve('./workers/TypeScriptCheckWorker');
const sassBuildWorkerModulePath = require.resolve('./workers/SassBuildWorker');
const jsMinifyWorkerModulePath = require.resolve('./workers/JsMinifyWorker');

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

export function runTypeScriptBuildWorkerAsync(variables: IVariables) {
    return runWorkerAsync<void>(typeScriptBuildWorkerModulePath, variables);
}

export function runTypeScriptCheckWorkerAsync(variables: IVariables) {
    return runWorkerAsync<void>(typeScriptCheckWorkerModulePath, variables);
}

export function runSassBuildWorkerAsync(variables: IVariables) {
    return runWorkerAsync<void>(sassBuildWorkerModulePath, variables);
}

export function runMinifyWorkerAsync(variables: IMinifyInputs) {
    return runWorkerAsync<MinifyOutput>(jsMinifyWorkerModulePath, variables);
}
