import * as fse from 'fs-extra';
import { UserSettings } from './UserSettings';
import { UserSettingsPath } from './UserSettingsPath';

type ValidatorFunction = (x: string) => boolean;

const validators: Readonly<MapLike<ValidatorFunction>> = Object.freeze({
    'package-manager': (x: string) => ['npm', 'yarn', 'pnpm', 'disabled'].includes(x),
    'mute': (x: string) => ['true', 'false'].includes(x)
});

const keyMap: Readonly<MapLike<string>> = Object.freeze({
    'package-manager': 'packageManager',
    'packageManager': 'package-manager',
    'mute': 'mute'
});

const defaultSettings: Readonly<UserSettings> = Object.freeze({
    packageManager: 'npm',
    mute: false,
});

export const userSettingsOptions = Object.freeze(Object.keys(validators));

export async function getSettings(): Promise<UserSettings> {
    const settings: UserSettings = Object.assign({}, defaultSettings);

    try {
        const currentSettings: UserSettings = await fse.readJson(UserSettingsPath.settings);
        for (const key in defaultSettings) {
            const value = currentSettings[key];
            // avoid reading invalid settings... (reset to good known default settings)
            if (value) {
                const validatorKey = keyMap[key];
                const validator = validators[validatorKey];
                if (validator(value)) {
                    settings[key] = currentSettings[key];
                }
            }
        }
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

    const trueKey = keyMap[key];
    let trueValue: string | boolean | number = value;
    try {
        trueValue = JSON.parse(value);
    } catch (error) {
        // value is already a string (non-escaped)
    }

    const settings = await getSettings();
    settings[trueKey] = trueValue;
    await fse.outputJson(UserSettingsPath.settings, settings);
    return UserSettingsPath.settings;
}
