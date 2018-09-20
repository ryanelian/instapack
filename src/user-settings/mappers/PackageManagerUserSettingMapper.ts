import { IUserSettingMapper } from "./IUserSettingMapper";

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
