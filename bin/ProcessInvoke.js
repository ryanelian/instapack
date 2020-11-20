"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupHttps = exports.downloadMkcert = exports.askUserDownloadMkcert = exports.restorePackages = exports.addVueCompilerServices = exports.selectPackageManager = exports.execWithConsoleOutput = void 0;
const ChildProcess = require("child_process");
const which = require("which");
const readline = require("readline");
const ProgressBar = require("progress");
const follow_redirects_1 = require("follow-redirects");
const fse = require("fs-extra");
const upath = require("upath");
const UserSettingsPath_1 = require("./user-settings/UserSettingsPath");
const chalk = require("chalk");
const Shout_1 = require("./Shout");
const VueLoaderVersions_1 = require("./VueLoaderVersions");
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
async function detectLockfile(root) {
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
async function selectPackageManager(preference, root) {
    if (!preference) {
        preference = 'npm';
    }
    const lockfile = await detectLockfile(root);
    if (lockfile) {
        return lockfile;
    }
    let exists = true;
    if (preference !== 'npm') {
        exists = await isCommandExist(preference);
    }
    if (exists) {
        return preference;
    }
    return 'npm';
}
exports.selectPackageManager = selectPackageManager;
function getVueCompilerServicePackageVersions(versions) {
    var _a, _b;
    if ((_a = versions.vue) === null || _a === void 0 ? void 0 : _a.startsWith('2')) {
        if (versions.loader === VueLoaderVersions_1.VueLoaderVersions.Vue2Loader && versions.compilerService === versions.vue) {
            return undefined;
        }
        else {
            return `vue-loader@${VueLoaderVersions_1.VueLoaderVersions.Vue2Loader} vue-template-compiler@${versions.vue}`;
        }
    }
    if ((_b = versions.vue) === null || _b === void 0 ? void 0 : _b.startsWith('3')) {
        if (versions.loader === VueLoaderVersions_1.VueLoaderVersions.Vue3Loader && versions.compilerService === versions.vue) {
            return undefined;
        }
        else {
            return `vue-loader@${VueLoaderVersions_1.VueLoaderVersions.Vue3Loader} @vue/compiler-sfc@${versions.vue}`;
        }
    }
    throw new Error(`Unknown vue version: ${versions.vue}`);
}
function addVueCompilerServices(packageManager, versions) {
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
            Shout_1.Shout.error('Your Vue.js project requires additional packages to compile but instapack package manager is disabled!');
            Shout_1.Shout.error('Please install these packages manually: ' + packages);
            break;
        }
        default: {
            throw new Error('Unknown package manager.');
        }
    }
}
exports.addVueCompilerServices = addVueCompilerServices;
async function restorePackages(packageManager, root) {
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
exports.restorePackages = restorePackages;
const isWindows = process.platform === 'win32';
async function askUserDownloadMkcert() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return await new Promise((ok) => {
        rl.question('mkcert is not found in CLI path. Download mkcert? [Y/n] ', answer => {
            answer = answer.trim().toUpperCase()[0];
            if (!answer || answer === 'Y') {
                ok(true);
            }
            else {
                ok(false);
            }
            rl.close();
        });
    });
}
exports.askUserDownloadMkcert = askUserDownloadMkcert;
async function downloadMkcert() {
    const downloadUri = 'https://github.com/FiloSottile/mkcert/releases/download/v1.4.1/mkcert-v1.4.1-windows-amd64.exe';
    const binary = await new Promise((ok, reject) => {
        const data = [];
        follow_redirects_1.https.get(downloadUri, res => {
            if (res.statusCode !== 200) {
                reject(new Error('Error downloading mkcert, HTTP Status Code: ' + res.statusCode));
                return;
            }
            const contentLength = res.headers['content-length'];
            let bar;
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
    await fse.writeFile(UserSettingsPath_1.UserSettingsPath.mkcertExe, binary);
    console.log(`\nSuccessfully downloaded mkcert to: ${UserSettingsPath_1.UserSettingsPath.mkcertExe}\n`);
}
exports.downloadMkcert = downloadMkcert;
async function setupHttps() {
    const mkcertExists = await isCommandExist('mkcert');
    let mkcertCommand = 'mkcert';
    let userMkcertExists = false;
    if (!mkcertExists && isWindows) {
        userMkcertExists = await fse.pathExists(UserSettingsPath_1.UserSettingsPath.mkcertExe);
        if (userMkcertExists === false) {
            const consent = await askUserDownloadMkcert();
            if (consent === true) {
                await downloadMkcert();
                userMkcertExists = true;
            }
        }
        if (userMkcertExists) {
            mkcertCommand = UserSettingsPath_1.UserSettingsPath.mkcertExe;
        }
    }
    if (!mkcertExists && !userMkcertExists) {
        throw new Error('mkcert is not found in CLI path.\nPlease install mkcert to setup HTTPS: https://github.com/FiloSottile/mkcert');
    }
    const installCommand = mkcertCommand + ' -install';
    execWithConsoleOutput(installCommand);
    mkcertCommand += ` -key-file ${UserSettingsPath_1.UserSettingsPath.keyFile}`;
    mkcertCommand += ` -cert-file ${UserSettingsPath_1.UserSettingsPath.certFile}`;
    mkcertCommand += ` "*.test" localhost 127.0.0.1 ::1`;
    execWithConsoleOutput(mkcertCommand);
}
exports.setupHttps = setupHttps;
