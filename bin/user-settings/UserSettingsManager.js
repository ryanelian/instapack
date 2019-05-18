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
const userSettingsFilePath = upath.join(OS.homedir(), 'instapack', 'settings.json');
function convertKebabToCamelCase(s) {
    return s.toLowerCase().replace(/-[a-z]/g, ss => {
        return ss[1].toUpperCase();
    });
}
const validators = Object.freeze({
    'package-manager': (x) => ['yarn', 'npm', 'disabled'].includes(x),
    'mute-notification': (x) => ['true', 'false'].includes(x)
});
const defaultSettings = Object.freeze({
    packageManager: 'yarn',
    muteNotification: false,
});
exports.userSettingsOptions = Object.freeze(Object.keys(validators));
function getSettings() {
    return __awaiter(this, void 0, void 0, function* () {
        let settings = Object.assign({}, defaultSettings);
        try {
            let currentSettings = yield fse.readJson(userSettingsFilePath);
            settings = Object.assign(settings, currentSettings);
        }
        catch (error) {
        }
        return settings;
    });
}
exports.getSettings = getSettings;
function setSetting(key, value) {
    return __awaiter(this, void 0, void 0, function* () {
        let validator = validators[key];
        if (!validator) {
            throw new Error('Invalid setting key! Please refer to README.');
        }
        value = value.toString().toLowerCase();
        let valid = validator(value);
        if (!valid) {
            throw new Error('Invalid setting value! Please refer to README.');
        }
        let trueKey = convertKebabToCamelCase(key);
        let trueValue = value;
        try {
            trueValue = JSON.parse(value);
        }
        catch (error) {
        }
        let settings = yield getSettings();
        settings[trueKey] = trueValue;
        yield fse.outputJson(userSettingsFilePath, settings);
    });
}
exports.setSetting = setSetting;
