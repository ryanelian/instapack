"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const upath = require("upath");
const fse = require("fs-extra");
const WorkerFarm = require("worker-farm");
const PrettyUnits_1 = require("./PrettyUnits");
const Shout_1 = require("./Shout");
function outputFileThenLog(filePath, content) {
    let bundle = Buffer.from(content, 'utf8');
    let info = upath.parse(filePath);
    let size = PrettyUnits_1.prettyBytes(bundle.byteLength);
    Shout_1.Shout.timed(chalk_1.default.blue(info.base), chalk_1.default.magenta(size), chalk_1.default.grey('in ' + info.dir + '/'));
    return fse.outputFile(filePath, bundle);
}
exports.outputFileThenLog = outputFileThenLog;
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
function objectSortByKeys(input) {
    let output = {};
    let keys = Object.keys(input).sort();
    for (let key of keys) {
        output[key] = input[key];
    }
    return output;
}
exports.objectSortByKeys = objectSortByKeys;
function mergePackageJson(projectPackageJson, templatePackageJson) {
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
                packageJson.devDependencies[packageName] = templatePackageJson.dependencies[packageName];
            }
            else {
                packageJson.dependencies[packageName] = templatePackageJson.dependencies[packageName];
            }
        }
    }
    if (templatePackageJson.devDependencies) {
        for (let packageName in templatePackageJson.devDependencies) {
            if (packageJson.dependencies[packageName]) {
                packageJson.dependencies[packageName] = templatePackageJson.devDependencies[packageName];
            }
            else {
                packageJson.devDependencies[packageName] = templatePackageJson.devDependencies[packageName];
            }
        }
    }
    packageJson.dependencies = objectSortByKeys(packageJson.dependencies);
    packageJson.devDependencies = objectSortByKeys(packageJson.devDependencies);
    return packageJson;
}
exports.mergePackageJson = mergePackageJson;
