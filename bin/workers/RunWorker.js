"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_farm_1 = __importDefault(require("worker-farm"));
const typeScriptBuildWorkerModulePath = require.resolve('./TypeScriptBuildWorker');
const typeScriptCheckWorkerModulePath = require.resolve('./TypeScriptCheckWorker');
const sassBuildWorkerModulePath = require.resolve('./SassBuildWorker');
const jsMinifyWorkerModulePath = require.resolve('./JsMinifyWorker');
function runWorkerAsync(modulePath, params) {
    return __awaiter(this, void 0, void 0, function* () {
        let worker = worker_farm_1.default(modulePath);
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
            worker_farm_1.default.end(worker);
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
function runMinifyWorker(variables) {
    return runWorkerAsync(jsMinifyWorkerModulePath, variables);
}
exports.runMinifyWorker = runMinifyWorker;
