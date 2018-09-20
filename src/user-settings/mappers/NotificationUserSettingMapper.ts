import { IUserSettingMapper } from "./IUserSettingMapper";

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
