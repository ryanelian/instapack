"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSettingsPath = void 0;
const upath = require("upath");
const OS = require("os");
const userFolderPath = upath.join(OS.homedir(), 'instapack');
const userMkcertExePath = upath.join(userFolderPath, 'mkcert.exe');
const userKeyFilePath = upath.join(userFolderPath, 'key.pem');
const userCertFilePath = upath.join(userFolderPath, 'cert.pem');
const userSettingsFilePath = upath.join(OS.homedir(), 'instapack', 'settings.json');
exports.UserSettingsPath = {
    folder: userFolderPath,
    mkcertExe: userMkcertExePath,
    keyFile: userKeyFilePath,
    certFile: userCertFilePath,
    settings: userSettingsFilePath
};
