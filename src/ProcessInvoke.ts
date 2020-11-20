import * as ChildProcess from 'child_process';
import which = require('which');
import * as readline from 'readline';
import ProgressBar = require('progress');
import { https } from 'follow-redirects';
import * as fse from 'fs-extra';
import * as upath from 'upath';
import { UserSettingsPath } from './user-settings/UserSettingsPath';
import { VuePackageVersions } from './variables-factory/BuildVariables';
import chalk = require('chalk');
import { Shout } from './Shout';
import { VueLoaderVersions } from './VueLoaderVersions';

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

async function detectLockfile(root: string): Promise<string | undefined> {
    const lockFiles = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'];
    const lockFilesPackageManager = ['pnpm', 'npm', 'yarn'];

    for (let i = 0; i < lockFiles.length; i++) {
        const lockFilePath = upath.join(root, lockFiles[i]);
        const lockFileExists = await fse.pathExists(lockFilePath);
        if (lockFileExists) {
            return lockFilesPackageManager[i];
        }
    }

    return undefined;
}

export async function selectPackageManager(preference: string | undefined, root: string): Promise<string> {
    if (!preference) {
        preference = 'npm';
    }

    const lockfile = await detectLockfile(root);
    if (lockfile) {
        return lockfile;
    }

    let exists = true;
    if (preference !== 'npm') {
        // check the existence of command line tool other than npm
        exists = await isCommandExist(preference);
    }

    if (exists) {
        return preference;
    }
    return 'npm';
}

function getVueCompilerServicePackageVersions(versions: VuePackageVersions): string | undefined {
    if (versions.vue?.startsWith('2')) {
        if (versions.loader === VueLoaderVersions.Vue2Loader && versions.compilerService === versions.vue) {
            return undefined;
        } else {
            return `vue-loader@${VueLoaderVersions.Vue2Loader} vue-template-compiler@${versions.vue}`;
        }
    }

    if (versions.vue?.startsWith('3')) {
        if (versions.loader === VueLoaderVersions.Vue3Loader && versions.compilerService === versions.vue) {
            return undefined;
        } else {
            return `vue-loader@${VueLoaderVersions.Vue3Loader} @vue/compiler-sfc@${versions.vue}`;
        }
    }

    throw new Error(`Unknown vue version: ${versions.vue}`);
}

export function addVueCompilerServices(packageManager: string, versions: VuePackageVersions): void {
    const packages = getVueCompilerServicePackageVersions(versions);
    if (!packages) {
        return;
    }

    console.log(chalk.greenBright('Vue.js') + ' project detected! Ensuring correct development dependencies are installed...');
    switch (packageManager) {
        case 'yarn': {
            execWithConsoleOutput(`yarn add ${packages} -D -E`);
            break;
        }
        case 'npm': {
            execWithConsoleOutput(`npm install ${packages} -D -E --loglevel error`);
            break;
        }
        case 'pnpm': {
            execWithConsoleOutput(`pnpm install ${packages} -D -E`);
            break;
        }
        case 'disabled': {
            Shout.error('Your Vue.js project requires additional packages to compile but instapack package manager is disabled!');
            Shout.error('Please install these packages manually: ' + packages)
            break;
        }
        default: {
            throw new Error('Unknown package manager.');
        }
    }
}

/**
 * Asynchronously attempts to restore project packages using selected tool.
 * If the tool is not defined, defaults to yarn.
 * If yarn is not found in the system, fallback to npm.
 * Throws if the tool is unknown.
 * @param packageManager
 */
export async function restorePackages(packageManager: string, root: string): Promise<void> {
    if (packageManager === 'disabled') {
        return;
    }

    const packageJson = upath.join(root, 'package.json');
    const packageJsonExists = await fse.pathExists(packageJson);
    if (!packageJsonExists) {
        console.log('package.json does not exists in project root folder, skipping package restore.');
        return;
    }

    switch (packageManager) {
        case 'yarn': {
            execWithConsoleOutput('yarn');
            break;
        }
        case 'npm': {
            execWithConsoleOutput('npm install --loglevel error');
            break;
        }
        case 'pnpm': {
            execWithConsoleOutput('pnpm install');
            break;
        }
        default: {
            throw new Error('Unknown package manager.');
        }
    }
}

const isWindows = process.platform === 'win32';

export async function askUserDownloadMkcert(): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return await new Promise<boolean>((ok) => {
        rl.question('mkcert is not found in CLI path. Download mkcert? [Y/n] ', answer => {
            answer = answer.trim().toUpperCase()[0];
            if (!answer || answer === 'Y') {
                ok(true);
            } else {
                ok(false);
            }
            rl.close();
        });
    });
}

export async function downloadMkcert(): Promise<void> {
    const downloadUri = 'https://github.com/FiloSottile/mkcert/releases/download/v1.4.1/mkcert-v1.4.1-windows-amd64.exe';

    const binary = await new Promise<Buffer>((ok, reject) => {
        const data: Uint8Array[] = [];

        https.get(downloadUri, res => {
            if (res.statusCode !== 200) {
                reject(new Error('Error downloading mkcert, HTTP Status Code: ' + res.statusCode));
                return;
            }

            const contentLength = res.headers['content-length'];
            let bar: ProgressBar | undefined;

            if (contentLength) {
                bar = new ProgressBar('Downloading mkcert [:bar] :percent ETA: :etas', {
                    complete: '=',
                    incomplete: ' ',
                    width: 50,
                    total: parseInt(contentLength)
                });
            }

            res.on('data', chunk => {
                data.push(chunk);
                bar && bar.tick(chunk.length);
            }).on('end', () => {
                ok(Buffer.concat(data));
            }).on('error', err => {
                reject(err);
                bar && bar.terminate();
            });
        }).end();
    });

    await fse.writeFile(UserSettingsPath.mkcertExe, binary)
    console.log(`\nSuccessfully downloaded mkcert to: ${UserSettingsPath.mkcertExe}\n`);
}

export async function setupHttps(): Promise<void> {
    const mkcertExists = await isCommandExist('mkcert');
    let mkcertCommand = 'mkcert';
    let userMkcertExists = false;

    if (!mkcertExists && isWindows) {
        userMkcertExists = await fse.pathExists(UserSettingsPath.mkcertExe)
        if (userMkcertExists === false) {
            const consent = await askUserDownloadMkcert();
            if (consent === true) {
                await downloadMkcert();
                userMkcertExists = true;
            }
        }
        if (userMkcertExists) {
            mkcertCommand = UserSettingsPath.mkcertExe;
        }
    }

    if (!mkcertExists && !userMkcertExists) {
        throw new Error('mkcert is not found in CLI path.\nPlease install mkcert to setup HTTPS: https://github.com/FiloSottile/mkcert');
    }

    const installCommand = mkcertCommand + ' -install';
    execWithConsoleOutput(installCommand);

    mkcertCommand += ` -key-file ${UserSettingsPath.keyFile}`;
    mkcertCommand += ` -cert-file ${UserSettingsPath.certFile}`;
    mkcertCommand += ` "*.test" localhost 127.0.0.1 ::1`;
    execWithConsoleOutput(mkcertCommand);

    // https://en.wikipedia.org/wiki/.test
    // https://webdevstudios.com/2017/12/12/google-chrome-63/
}
