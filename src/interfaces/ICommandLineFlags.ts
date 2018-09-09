import { IMapLike } from "./IMapLike";

/**
 * Defines build flags to be passed when invoking instapack using the Command Line Interface.
 */
export interface ICommandLineFlags {
    production: boolean;
    sourceMap: boolean;
    watch: boolean;
    stats: boolean;
    verbose: boolean;
    hot: boolean;
    env: IMapLike<string>;
}
