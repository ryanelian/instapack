import * as upath from 'upath';
import * as OS from 'os';

const userFolderPath: string = upath.join(OS.homedir(), 'instapack');
const userMkcertExePath: string = upath.join(userFolderPath, 'mkcert.exe');
const userKeyFilePath: string = upath.join(userFolderPath, 'key.pem');
const userCertFilePath: string = upath.join(userFolderPath, 'cert.pem');
const userSettingsFilePath: string = upath.join(OS.homedir(), 'instapack', 'settings.json');

export const UserSettingsPath = {
    folder: userFolderPath,
    mkcertExe: userMkcertExePath,
    keyFile: userKeyFilePath,
    certFile: userCertFilePath,
    settings: userSettingsFilePath
};
