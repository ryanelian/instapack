import * as upath from 'upath';
import * as os from 'os';
import * as fse from 'fs-extra';
import chalk from 'chalk';

/**
 * Values set-able using instapack CLI.
 */
export interface IGlobalSettings {
    packageManager: string;
}

export class GlobalSettingsManager {
    /**
     * Global configuration file path in user's home folder.
     */
    get globalConfigurationJsonPath(): string {
        return upath.join(os.homedir(), 'instapack', 'settings.json');
    }

    private keyMapper = {
        'package-manager': 'packageManager'
    }

    validate(key: string, value: string) {
        if (!this.keyMapper[key]) {
            return false;
        }

        switch (key) {
            case 'package-manager': {
                if (value !== 'yarn' && value !== 'npm') {
                    return false;
                }
                break;
            }
            default: {
                break;
            }
        }

        return true;
    }

    async tryRead(): Promise<IGlobalSettings> {
        try {
            return await fse.readJson(this.globalConfigurationJsonPath);
        }
        catch {
            // console.log('Failed to read global configuration file; creating a new one instead.');
            return {
                packageManager: 'yarn'
            };
        }
    }

    async set(key: string, value: string) {
        let file = this.globalConfigurationJsonPath;
        console.log('Using global configuration file:', chalk.cyan(file));

        let settings = await this.tryRead();
        let realKey = this.keyMapper[key];
        settings[realKey] = value;

        try {
            await fse.ensureFile(file);
            await fse.writeJson(file, settings);
            console.log('Successfully saved new configuration!');
        } catch (error) {
            console.error('Error when saving file:');
            console.error(error);
        }
    }
}