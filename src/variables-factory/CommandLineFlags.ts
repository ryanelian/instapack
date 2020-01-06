/**
 * Defines build flags to be passed when invoking instapack using the Command Line Interface.
 */
export interface CommandLineFlags {
    production: boolean;
    sourceMap: boolean;
    watch: boolean;
    stats: boolean;
    serve: boolean;
    env: MapLike<string>;
    https: boolean;
    reactRefresh: boolean;
}
