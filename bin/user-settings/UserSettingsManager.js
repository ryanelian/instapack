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
    'mute': (x) => ['true', 'false'].includes(x)
});
const defaultSettings = Object.freeze({
    packageManager: 'yarn',
    mute: false,
});
exports.userSettingsOptions = Object.freeze(Object.keys(validators));
function getSettings() {
    return __awaiter(this, void 0, void 0, function* () {
        const settings = Object.assign({}, defaultSettings);
        try {
            const currentSettings = yield fse.readJson(userSettingsFilePath);
            for (const key in defaultSettings) {
                const value = currentSettings[key];
                if (value && validators[key](value)) {
                    settings[key] = currentSettings[key];
                }
            }
        }
        catch (error) {
        }
        return settings;
    });
}
exports.getSettings = getSettings;
function setSetting(key, value) {
    return __awaiter(this, void 0, void 0, function* () {
        const validator = validators[key];
        if (!validator) {
            throw new Error('Invalid setting key! Please refer to README.');
        }
        value = value.toString().toLowerCase();
        const valid = validator(value);
        if (!valid) {
            throw new Error('Invalid setting value! Please refer to README.');
        }
        const trueKey = convertKebabToCamelCase(key);
        let trueValue = value;
        try {
            trueValue = JSON.parse(value);
        }
        catch (error) {
        }
        const settings = yield getSettings();
        settings[trueKey] = trueValue;
        yield fse.outputJson(userSettingsFilePath, settings);
        return userSettingsFilePath;
    });
}
exports.setSetting = setSetting;
