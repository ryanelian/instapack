/**
 * Contains members for remapping a user input settings into IGlobalSettings-compatible objects.
 */
export interface IUserSettingMapper<T> {
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
