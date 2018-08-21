/**
 * A simple key-value store.
 */
interface IMapLike<T> {
    [key: string]: T
}

/**
 * Values required to construct an instapack Settings object.
 */
interface ISettingsCore {
    input: string;
    output: string;
    concat: IMapLike<string[]>;
    alias: IMapLike<string>;
    externals: IMapLike<string>;
    jsOut: string;
    cssOut: string;
    port1: number;
    port2: number;
}

/**
 * Defines build flags to be used by Compiler class.
 */
interface IBuildFlags {
    production: boolean;
    watch: boolean;
    sourceMap: boolean;
    stats: boolean;
    env: IMapLike<string>;
    notification?: boolean;
    hot: boolean;
}

/**
 * Represents serializable parameters for build workers.
 */
interface IBuildCommand {
    root: string;
    settings: ISettingsCore;
    flags: IBuildFlags;
}
