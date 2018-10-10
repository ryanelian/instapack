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
const Process = require("process");
const ChildProcess = require("child_process");
class PackageManager {
    get isWindows() {
        return (Process.platform === 'win32');
    }
    get isMac() {
        return (Process.platform === 'darwin');
    }
    toolExistCheckerCommand(tool) {
        if (this.isWindows) {
            return 'where ' + tool;
        }
        else if (this.isMac) {
            return 'which ' + tool;
        }
        else {
            return 'whereis ' + tool;
        }
    }
    runWithOutputs(command) {
        return ChildProcess.execSync(command, {
            stdio: [0, 1, 2]
        });
    }
    doesToolExists(tool) {
        return new Promise((ok, reject) => {
            ChildProcess.exec(this.toolExistCheckerCommand(tool), (error, stdout, stderr) => {
                if (error) {
                    ok(false);
                }
                else {
                    ok(true);
                }
            });
        });
    }
    restore(packageManager) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!packageManager) {
                packageManager = 'yarn';
            }
            if (packageManager === 'yarn') {
                let yarnExists = yield this.doesToolExists('yarn');
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
