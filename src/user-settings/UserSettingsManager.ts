import * as upath from 'upath';
import * as OS from 'os';
import * as fse from 'fs-extra';
import { UserSettings } from './UserSettings';

const userSettingsFilePath: string = upath.join(OS.homedir(), 'instapack', 'settings.json');

function convertKebabToCamelCase(s: string): string {
    return s.toLowerCase().replace(/-[a-z]/g, ss => {
        return ss[1].toUpperCase();
    });
}

type ValidatorFunction = (x: string) => boolean;

const validators: Readonly<MapLikeObject<ValidatorFunction>> = Object.freeze({
    'package-manager': (x: string) => ['yarn', 'npm', 'disabled'].includes(x),
    'silent': (x: string) => ['true', 'false'].includes(x)
});

const defaultSettings: Readonly<UserSettings> = Object.freeze({
    packageManager: 'yarn',
    silent: false,
});

export const userSettingsOptions = Object.freeze(Object.keys(validators));

export async function getSettings(): Promise<UserSettings> {
    let settings: UserSettings = Object.assign({}, defaultSettings);

    try {
        const currentSettings: UserSettings = await fse.readJson(userSettingsFilePath);
        settings = Object.assign(settings, currentSettings);
    } catch (error) {
        // use default settings
    }

    return settings;
}

export async function setSetting(key: string, value: string): Promise<string> {
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
    let trueValue: string | boolean | number = value;
    try {
        trueValue = JSON.parse(value);
    } catch (error) {
        // value is already a string (non-escaped)
    }

    const settings = await getSettings();
    settings[trueKey] = trueValue;
    await fse.outputJson(userSettingsFilePath, settings);
    return userSettingsFilePath;
}
