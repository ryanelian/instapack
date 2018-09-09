import upath from 'upath';
import os from 'os';
import fse from 'fs-extra';

import { IMapLike } from './interfaces/IMapLike';
import { IUserSettings } from './interfaces/IUserSettings';

/**
 * Contains members for remapping a user input settings into IGlobalSettings-compatible objects.
 */
interface IUserSettingMapper<T> {
    /**
     * Gets the real key of the setting when stored.
     */
    readonly key: string,

    /**
     * Convert user input value into its object representative.
     */
    valueTransformer: (value: string) => T,

    /**
     * Validates the user input value.
     */
    valueValidator: (value: string) => boolean
}

/**
 * Remaps user input setting for package manager selection.
 */
export class PackageManagerUserSettingMapper implements IUserSettingMapper<string> {
    /**
     * Gets the real key of the setting when stored.
     */
    readonly key: string = 'packageManager';

    /**
     * Returns user input as its lowercase.
     */
    valueTransformer = (value: string) => value.toLowerCase();

    /**
     * Returns true when user input is either `yarn` or `npm`, case insensitive.
     */
    valueValidator = (value: string) => {
        value = value.toLowerCase();
        return (value === 'yarn' || value === 'npm' || value === 'disabled');
    }
}

/**
 * Remaps user input setting for notification.
 */
export class NotificationUserSettingMapper implements IUserSettingMapper<boolean> {
    /**
     * Gets the real key of the setting when stored.
     */
    readonly key: string = 'muteNotification';

    /**
     * Convert user input value into its object representative.
     */
    valueTransformer = (value: string) => {
        return (value.toLowerCase() === 'true');
    };

    /**
     * Validates the user input value.
     */
    valueValidator = (value: string) => {
        value = value.toLowerCase();
        return (value === 'true' || value === 'false');
    };
}

export class UserSettingsManager {
    get userSettingsFilePath() {
        return upath.join(os.homedir(), 'instapack', 'settings.json');
    }

    /**
     * A dictionary of user input setting key against its mapper class.
     */
    private settingMappers: IMapLike<IUserSettingMapper<any>> = {
        'package-manager': new PackageManagerUserSettingMapper(),
        'mute-notification': new NotificationUserSettingMapper()
    };

    get availableSettings() {
        return Object.keys(this.settingMappers);
    }

    /**
     * Validates whether the input setting is correct.
     * @param key 
     * @param value 
     */
    validate(key: string, value: string) {
        if (!this.settingMappers[key]) {
            return false;
        }

        return this.settingMappers[key].valueValidator(value);
    }

    async readUserSettingsFrom(file: string): Promise<IUserSettings> {
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

    set(settings: IUserSettings, key: string, value: string) {
        let mapper = this.settingMappers[key];
        if (!mapper) {
            throw new Error('Mapper not registered for provided key: ' + key);
        }

        let realKey = mapper.key;
        let realValue = mapper.valueTransformer(value);

        settings[realKey] = realValue;
    }
}