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
const upath = require("upath");
const OS = require("os");
const fse = require("fs-extra");
const PackageManagerUserSettingMapper_1 = require("./mappers/PackageManagerUserSettingMapper");
const NotificationUserSettingMapper_1 = require("./mappers/NotificationUserSettingMapper");
exports.userSettingsFilePath = upath.join(OS.homedir(), 'instapack', 'settings.json');
let userSettingMappers = {
    'package-manager': new PackageManagerUserSettingMapper_1.PackageManagerUserSettingMapper(),
    'mute-notification': new NotificationUserSettingMapper_1.NotificationUserSettingMapper()
};
exports.userSettingOptions = Object.keys(userSettingMappers);
function validateUserSetting(key, value) {
    if (!userSettingMappers[key]) {
        return false;
    }
    return userSettingMappers[key].valueValidator(value);
}
exports.validateUserSetting = validateUserSetting;
function readUserSettingsFrom(file) {
    return __awaiter(this, void 0, void 0, function* () {
        let settings = {
            muteNotification: false,
            packageManager: 'yarn'
        };
        try {
            let json = yield fse.readJson(file);
            if (json.packageManager === 'yarn' || json.packageManager === 'npm' || json.packageManager === 'disabled') {
                settings.packageManager = json.packageManager;
            }
            if (typeof json.muteNotification === 'boolean') {
                settings.muteNotification = json.muteNotification;
            }
        }
        catch (_a) {
        }
        return settings;
    });
}
exports.readUserSettingsFrom = readUserSettingsFrom;
function setUserSetting(settings, key, value) {
    let mapper = userSettingMappers[key];
    if (!mapper) {
        throw new Error('Mapper not registered for provided key: ' + key);
    }
    let realKey = mapper.key;
    let realValue = mapper.valueTransformer(value);
    settings[realKey] = realValue;
}
exports.setUserSetting = setUserSetting;
