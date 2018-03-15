import * as upath from 'upath';
import * as os from 'os';
import * as fse from 'fs-extra';
import chalk from 'chalk';

/**
 * Values set-able using instapack CLI.
 */
export interface IGlobalSettings {
    packageManager: string;

    integrityCheck: boolean;
}

export interface ISettingMapper<T> {
    key: string,

    valueTransformer: (value: string) => T,

    valueValidator: (value: string) => boolean
}

export interface SettingMappers {
    [key: string]: ISettingMapper<any>
}

export class PackageManagerSettingMapper implements ISettingMapper<string> {
    key: string = 'packageManager';

    valueTransformer = (value: string) => value;

    valueValidator = (value: string) => {
        return (value === 'yarn' || value === 'npm');
    }
}

export class IntegrityCheckSettingMapper implements ISettingMapper<boolean> {
    key: string = 'integrityCheck';

    valueTransformer = (value: string) => {
        return (value.toLowerCase() === 'true');
    };

    valueValidator = (value: string) => {
        return (value === 'true' || value === 'false');
    };
}

export class GlobalSettingsManager {
    /**
     * Global setting file path in user's home folder.
     */
    get globalSettingJsonPath(): string {
        return upath.join(os.homedir(), 'instapack', 'settings.json');
    }

    private settingMappers: SettingMappers = {
        'package-manager': new PackageManagerSettingMapper(),
        'integrity-check': new IntegrityCheckSettingMapper()
    };

    get availableSettings() {
        return Object.keys(this.settingMappers);
    }

    validate(key: string, value: string) {
        if (!this.settingMappers[key]) {
            return false;
        }

        return this.settingMappers[key].valueValidator(value);
    }

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

    async set(key: string, value: string) {
        let file = this.globalSettingJsonPath;
        console.log('Global settings file:', chalk.cyan(file));

        let settings = await this.tryRead();
        let realKey = this.settingMappers[key].key;
        let realValue = this.settingMappers[key].valueTransformer(value);
        settings[realKey] = realValue;

        try {
            await fse.ensureFile(file);
            await fse.writeJson(file, settings);
            console.log('Successfully saved the new setting!');
        } catch (error) {
            console.error('Error when saving file:');
            console.error(error);
        }
    }
}