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
const ChildProcess = require("child_process");
const which = require("which");
const UserSettingsPath_1 = require("./user-settings/UserSettingsPath");
function execWithConsoleOutput(command) {
    return ChildProcess.execSync(command, {
        stdio: [0, 1, 2]
    });
}
exports.execWithConsoleOutput = execWithConsoleOutput;
function isCommandExist(command) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return Boolean(yield which(command));
        }
        catch (error) {
            return false;
        }
    });
}
function restorePackages(packageManager) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!packageManager) {
            packageManager = 'yarn';
        }
        if (packageManager === 'yarn') {
            const yarnExists = yield isCommandExist('yarn');
            if (!yarnExists) {
                packageManager = 'npm';
            }
        }
        switch (packageManager) {
            case 'yarn': {
                execWithConsoleOutput('yarn');
                break;
            }
            case 'npm': {
                execWithConsoleOutput('npm install');
                break;
            }
            default: {
                throw new Error('Unknown package manager.');
            }
        }
    });
}
exports.restorePackages = restorePackages;
function setupHttps() {
    return __awaiter(this, void 0, void 0, function* () {
        const mkcertExists = yield isCommandExist('mkcert');
        if (!mkcertExists) {
            throw new Error('mkcert is not found in CLI path.\nPlease install mkcert to setup HTTPS: https://github.com/FiloSottile/mkcert');
        }
        execWithConsoleOutput('mkcert -install');
        let mkcertCommand = "mkcert";
        mkcertCommand += ` -key-file ${UserSettingsPath_1.UserSettingsPath.keyFile}`;
        mkcertCommand += ` -cert-file ${UserSettingsPath_1.UserSettingsPath.certFile}`;
        mkcertCommand += ` "*.test" localhost 127.0.0.1 ::1`;
        execWithConsoleOutput(mkcertCommand);
    });
}
exports.setupHttps = setupHttps;
