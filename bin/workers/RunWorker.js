"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const WorkerFarm = require("worker-farm");
const typeScriptBuildWorkerModulePath = require.resolve('./TypeScriptBuildWorker');
const typeScriptCheckWorkerModulePath = require.resolve('./TypeScriptCheckWorker');
const sassBuildWorkerModulePath = require.resolve('./SassBuildWorker');
function runWorkerAsync(modulePath, params) {
    return __awaiter(this, void 0, void 0, function* () {
        let worker = WorkerFarm(modulePath);
        try {
            let p = new Promise((ok, reject) => {
                worker(params, (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        ok(result);
                    }
                });
            });
            return yield p;
        }
        finally {
            WorkerFarm.end(worker);
        }
    });
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
