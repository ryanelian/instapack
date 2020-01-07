export interface UserSettings {
    /**
     * Gets the user settings for the package manager used for automatic project restore prior builds. 
     */
    packageManager: 'npm' | 'yarn' | 'disabled';
    
    /**
     * Gets the user settings for disabling voice assistant on build failure.
     */
    mute: boolean;
}
