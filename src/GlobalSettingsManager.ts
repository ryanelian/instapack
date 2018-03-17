import * as upath from 'upath';
import * as os from 'os';
import * as fse from 'fs-extra';
import chalk from 'chalk';

/**
 * Values used by instapack CLI in the machine, unique per users.
 */
export interface IGlobalSettings {
    /**
     * Sets or gets the user default package manager. Possible values: `yarn` or `npm`
     */
    packageManager: string;

    /**
     * Sets or gets true when package restore should be done prior build.
     */
    integrityCheck: boolean;
}

/**
 * Contains members for remapping a user input settings into IGlobalSettings-compatible objects.
 */
export interface ISettingMapper<T> {
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
export class PackageManagerSettingMapper implements ISettingMapper<string> {
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
        return (value === 'yarn' || value === 'npm');
    }
}

/**
 * Remaps user input setting for integrity check toggle.
 */
export class IntegrityCheckSettingMapper implements ISettingMapper<boolean> {
    /**
     * Gets the real key of the setting when stored.
     */
    readonly key: string = 'integrityCheck';

    valueTransformer = (value: string) => {
        return (value.toLowerCase() === 'true');
    };

    valueValidator = (value: string) => {
        value = value.toString();
        return (value === 'true' || value === 'false');
    };
}

/**
 * Contains members for reading and writing the global tool settings.
 */
export class GlobalSettingsManager {
    /**
     * Global setting file path in user's home folder.
     */
    get globalSettingJsonPath(): string {
        return upath.join(os.homedir(), 'instapack', 'settings.json');
    }

    /**
     * A dictionary of user input setting key against its mapper class.
     */
    private settingMappers: {
        [key: string]: ISettingMapper<any>
    } = {
            'package-manager': new PackageManagerSettingMapper(),
            'integrity-check': new IntegrityCheckSettingMapper()
        };

    /**
     * Gets available global settings.
     */
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

    /**
     * Attemps to asynchronously read the user global setting from file.
     * If unable to do so for any reason, returns a default setting object 
     */
    async tryRead(): Promise<IGlobalSettings> {
        try {
            return await fse.readJson(this.globalSettingJsonPath);
        }
        catch {
            // console.log('Failed to read global settings file; creating a new one instead.');
            return {
                packageManager: 'yarn',
                integrityCheck: true
            };
        }
    }

    /**
     * Asynchronously write the user global setting file using new input setting.
     * If file did not exist, create it.
     * @param key 
     * @param value 
     */
    async set(key: string, value: string) {
        let file = this.globalSettingJsonPath;
        console.log('Global settings file:', chalk.cyan(file));

        let settings = await this.tryRead();
        let realKey = this.settingMappers[key].key;
        let realValue = this.settingMappers[key].valueTransformer(value);
        settings[realKey] = realValue;

        await fse.ensureFile(file);
        await fse.writeJson(file, settings);
        console.log('Successfully saved the new setting!');
    }
}