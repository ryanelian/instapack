"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WorkerFarm = require("worker-farm");
const typeScriptBuildWorkerModulePath = require.resolve('./TypeScriptBuildWorker');
const typeScriptCheckWorkerModulePath = require.resolve('./TypeScriptCheckWorker');
const sassBuildWorkerModulePath = require.resolve('./SassBuildWorker');
const copyBuildWorkerModulePath = require.resolve('./CopyBuildWorker');
async function runWorkerAsync(modulePath, params) {
    const worker = WorkerFarm(modulePath);
    try {
        const p = new Promise((ok, reject) => {
            worker(params, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    ok(result);
                }
            });
        });
        return await p;
    }
    finally {
        WorkerFarm.end(worker);
    }
}
exports.runWorkerAsync = runWorkerAsync;
function runTypeScriptBuildWorker(variables) {
    return runWorkerAsync(typeScriptBuildWorkerModulePath, variables);
}
exports.runTypeScriptBuildWorker = runTypeScriptBuildWorker;
function runTypeScriptCheckWorker(variables) {
    return runWorkerAsync(typeScriptCheckWorkerModulePath, variables);
}
exports.runTypeScriptCheckWorker = runTypeScriptCheckWorker;
function runSassBuildWorker(variables) {
    return runWorkerAsync(sassBuildWorkerModulePath, variables);
}
exports.runSassBuildWorker = runSassBuildWorker;
function runCopyBuildWorker(variables) {
    return runWorkerAsync(copyBuildWorkerModulePath, variables);
}
exports.runCopyBuildWorker = runCopyBuildWorker;
