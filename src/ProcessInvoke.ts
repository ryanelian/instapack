import * as ChildProcess from 'child_process';
import which = require('which');
import { UserSettingsPath } from './user-settings/UserSettingsPath';

/**
 * Runs a child process that displays outputs to current command line output.
 * @param command
 */
export function execWithConsoleOutput(command: string): Buffer {
    // inherit
    return ChildProcess.execSync(command, {
        stdio: [0, 1, 2]
    });
}

async function isCommandExist(command: string): Promise<boolean> {
    try {
        return Boolean(await which(command));
    } catch (error) {
        return false;
    }
}

/**
 * Asynchronously attempts to restore project packages using selected tool.
 * If the tool is not defined, defaults to yarn.
 * If yarn is not found in the system, fallback to npm.
 * Throws if the tool is unknown.
 * @param packageManager
 */
export async function restorePackages(packageManager: string): Promise<void> {
    if (!packageManager) {
        packageManager = 'yarn';
    }

    if (packageManager === 'yarn') {
        const yarnExists = await isCommandExist('yarn');
        if (!yarnExists) {
            packageManager = 'npm';
        }
    }

    // console.log(settings.packageManager);

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

export async function setupHttps(): Promise<void> {
    const mkcertExists = await isCommandExist('mkcert');
    if (!mkcertExists) {
        throw new Error('mkcert is not found in CLI path.\nPlease install mkcert to setup HTTPS: https://github.com/FiloSottile/mkcert');
    }

    execWithConsoleOutput('mkcert -install');

    let mkcertCommand = "mkcert";
    mkcertCommand += ` -key-file ${UserSettingsPath.keyFile}`;
    mkcertCommand += ` -cert-file ${UserSettingsPath.certFile}`;
    mkcertCommand += ` "*.test" localhost 127.0.0.1 ::1`;
    execWithConsoleOutput(mkcertCommand);

    // https://en.wikipedia.org/wiki/.test
    // https://webdevstudios.com/2017/12/12/google-chrome-63/
}