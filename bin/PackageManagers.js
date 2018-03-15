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
const cp = require("child_process");
const process_1 = require("process");
class PackageManager {
    get isWindows() {
        return (process_1.platform === 'win32');
    }
    get isOSX() {
        return (process_1.platform === 'darwin');
    }
    commandExistCheckerCommand(command) {
        if (this.isWindows) {
            return 'where ' + command;
        }
        else if (this.isOSX) {
            return 'which ' + command;
        }
        else {
            return 'whereis ' + command;
        }
    }
    runWithOutputs(command) {
        return cp.execSync(command, {
            stdio: [0, 1, 2]
        });
    }
    doesCommandExists(command) {
        return new Promise((ok, reject) => {
            cp.exec(this.commandExistCheckerCommand(command), (error, stdout, stderr) => {
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
                let yarnExists = yield this.doesCommandExists('yarn');
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
