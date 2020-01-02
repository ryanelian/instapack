"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const upath = require("upath");
const OS = require("os");
const userFolderPath = upath.join(OS.homedir(), 'instapack');
const userKeyFilePath = upath.join(userFolderPath, 'key.pem');
const userCertFilePath = upath.join(userFolderPath, 'cert.pem');
const userSettingsFilePath = upath.join(OS.homedir(), 'instapack', 'settings.json');
exports.UserSettingsPath = {
    folder: userFolderPath,
    keyFile: userKeyFilePath,
    certFile: userCertFilePath,
    settings: userSettingsFilePath
};
