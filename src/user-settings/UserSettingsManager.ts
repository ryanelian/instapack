import * as upath from 'upath';
import * as OS from 'os';
import * as fse from 'fs-extra';
import { IUserSettings } from './IUserSettings';

const userSettingsFilePath: string = upath.join(OS.homedir(), 'instapack', 'settings.json');

function convertKebabToCamelCase(s: string) {
    return s.toLowerCase().replace(/-[a-z]/g, ss => {
        return ss[1].toUpperCase();
    });
}

type ValidatorFunction = (x: string) => boolean;

const validators: Readonly<IMapLike<ValidatorFunction>> = Object.freeze({
    'package-manager': (x: string) => ['yarn', 'npm', 'disabled'].includes(x),
    'mute-notification': (x: string) => ['true', 'false'].includes(x)
});

const defaultSettings: Readonly<IUserSettings> = Object.freeze({
    packageManager: 'yarn',
    muteNotification: false,
});

export const userSettingsOptions = Object.freeze(Object.keys(validators));

export async function getSettings() {
    let settings: IUserSettings = Object.assign({}, defaultSettings);

    try {
        let currentSettings: IUserSettings = await fse.readJson(userSettingsFilePath);
        settings = Object.assign(settings, currentSettings);
    } catch (error) {
    }

    return settings;
}

export async function setSetting(key: string, value: string) {
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
    let trueValue: string | boolean | number = value;
    try {
        trueValue = JSON.parse(value);
    } catch (error) {
    }

    let settings = await getSettings();
    settings[trueKey] = trueValue;
    await fse.outputJson(userSettingsFilePath, settings);
}
