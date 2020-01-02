"use strict";
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
async function isCommandExist(command) {
    try {
        return Boolean(await which(command));
    }
    catch (error) {
        return false;
    }
}
async function restorePackages(packageManager) {
    if (!packageManager) {
        packageManager = 'yarn';
    }
    if (packageManager === 'yarn') {
        const yarnExists = await isCommandExist('yarn');
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
}
exports.restorePackages = restorePackages;
async function setupHttps() {
    const mkcertExists = await isCommandExist('mkcert');
    if (!mkcertExists) {
        throw new Error('mkcert is not found in CLI path.\nPlease install mkcert to setup HTTPS: https://github.com/FiloSottile/mkcert');
    }
    execWithConsoleOutput('mkcert -install');
    let mkcertCommand = "mkcert";
    mkcertCommand += ` -key-file ${UserSettingsPath_1.UserSettingsPath.keyFile}`;
    mkcertCommand += ` -cert-file ${UserSettingsPath_1.UserSettingsPath.certFile}`;
    mkcertCommand += ` "*.test" localhost 127.0.0.1 ::1`;
    execWithConsoleOutput(mkcertCommand);
}
exports.setupHttps = setupHttps;
