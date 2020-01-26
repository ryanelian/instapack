"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fse = require("fs-extra");
const UserSettingsPath_1 = require("./UserSettingsPath");
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
    packageManager: 'npm',
    mute: false,
});
exports.userSettingsOptions = Object.freeze(Object.keys(validators));
async function getSettings() {
    const settings = Object.assign({}, defaultSettings);
    try {
        const currentSettings = await fse.readJson(UserSettingsPath_1.UserSettingsPath.settings);
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
}
exports.getSettings = getSettings;
async function setSetting(key, value) {
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
    const settings = await getSettings();
    settings[trueKey] = trueValue;
    await fse.outputJson(UserSettingsPath_1.UserSettingsPath.settings, settings);
    return UserSettingsPath_1.UserSettingsPath.settings;
}
exports.setSetting = setSetting;
