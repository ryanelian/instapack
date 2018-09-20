import upath from 'upath';
import os from 'os';
import fse from 'fs-extra';
import { IMapLike } from '../interfaces/IMapLike';
import { PackageManagerUserSettingMapper } from './mappers/PackageManagerUserSettingMapper';
import { NotificationUserSettingMapper } from './mappers/NotificationUserSettingMapper';
import { IUserSettings } from './IUserSettings';
import { IUserSettingMapper } from './mappers/IUserSettingMapper';

export let userSettingsFilePath: string = upath.join(os.homedir(), 'instapack', 'settings.json');

let userSettingMappers: IMapLike<IUserSettingMapper<any>> = {
    'package-manager': new PackageManagerUserSettingMapper(),
    'mute-notification': new NotificationUserSettingMapper()
};

export let userSettingOptions = Object.keys(userSettingMappers);

/**
 * Validates whether the input setting is correct.
 * @param key 
 * @param value 
 */
export function validateUserSetting(key: string, value: string) {
    if (!userSettingMappers[key]) {
        return false;
    }

    return userSettingMappers[key].valueValidator(value);
}

export async function readUserSettingsFrom(file: string): Promise<IUserSettings> {
    let settings: IUserSettings = {
        muteNotification: false,
        packageManager: 'yarn'
    };

    try {
        let json = await fse.readJson(file);

        if (json.packageManager === 'yarn' || json.packageManager === 'npm' || json.packageManager === 'disabled') {
            settings.packageManager = json.packageManager;
        }

        if (typeof json.muteNotification === 'boolean') {
            settings.muteNotification = json.muteNotification;
        }
    }
    catch {
        // console.log('Failed to read user settings file; creating a new one instead.');
    }

    return settings;
}

export function setUserSetting(settings: IUserSettings, key: string, value: string) {
    let mapper = userSettingMappers[key];
    if (!mapper) {
        throw new Error('Mapper not registered for provided key: ' + key);
    }

    let realKey = mapper.key;
    let realValue = mapper.valueTransformer(value);

    settings[realKey] = realValue;
}
