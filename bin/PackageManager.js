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
const ChildProcess = require("child_process");
const which = require("which");
class PackageManager {
    runWithOutputs(command) {
        return ChildProcess.execSync(command, {
            stdio: [0, 1, 2]
        });
    }
    whichAsync(tool) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((ok, reject) => {
                which(tool, (err, path) => {
                    if (err) {
                        ok(false);
                        return;
                    }
                    ok(true);
                });
            });
        });
    }
    restore(packageManager) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!packageManager) {
                packageManager = 'yarn';
            }
            if (packageManager === 'yarn') {
                let yarnExists = yield this.whichAsync('yarn');
                if (!yarnExists) {
                    packageManager = 'npm';
                }
            }
            switch (packageManager) {
                case 'yarn': {
                    this.runWithOutputs('yarn');
                    break;
                }
                case 'npm': {
                    this.runWithOutputs('npm install');
                    break;
                }
                default: {
                    throw new Error('Unknown package manager.');
                }
            }
        });
    }
}
exports.PackageManager = PackageManager;
