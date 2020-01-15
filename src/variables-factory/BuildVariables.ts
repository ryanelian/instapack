import { UserSettings } from "../user-settings/UserSettings";

export interface ProjectSettings {
    /**
     * Gets the project root folder path.
     */
    root: string;

    /**
     * Gets the project source input folder name.
     */
    input: string;

    /**
     * Gets the project assets output folder name.
     */
    output: string;

    /**
     * Gets the JS output file name.
     */
    jsOut: string;

    /**
     * Gets the CSS output file name.
     */
    cssOut: string;

    /**
     * Gets the static port number to be used by the Hot Reload server for delivering built assets.
     */
    port1: number;

    /**
     * Replaces dependency imports to another dependency. For example: {'vue': 'vue/dist/vue.esm'}
     */
    alias: MapLike<string>;

    /**
     * Rewrites dependency imports to a global object. For example: {'jquery': '$'}
     */
    externals: MapLike<string | string[] | MapLike<string | string[]>>;

    /**
     * Gets the global object reference name for root exported modules.
     */
    namespace: string | undefined;

    /**
     * Gets the library manager asset copy build options.
     */
    copy: CopyOption[];
}

export interface CopyOption {
    /**
     * Gets the package name.
     */
    library: string;

    /**
     * Gets a list of file or folder or blob names to be copied.
     */
    files: string[];

    /**
     * Gets the destination file or folder name.
     */
    destination: string;
}

/**
 * Defines build flags to be passed when invoking instapack using the Command Line Interface.
 */
export interface CommandLineFlags {
    /**
     * Gets the production mode build flag, which enables minification and optimization of the build outputs. 
     */
    production: boolean;

    /**
     * Gets the enable source map build flag, which enables debugging of the bundled outputs.  
     */
    sourceMap: boolean;

    /**
     * Gets the watch mode build flag, which enables incremental compilation of mutated source codes.
     */
    watch: boolean;

    /**
     * Gets the hot reload development mode build flag.
     */
    serve: boolean;

    /**
     * Gets the user-supplied environment variables from CLI or .env file.
     */
    env: MapLike<string>;

    /**
     * Gets the output JS stats build flags, for production build only. 
     */
    stats: boolean;

    /**
     * Gets the enable HTTPS hot reload dev server build flag.
     */
    https: boolean;

    /**
     * Gets the Fast Refresh for React dev server build flag.
     */
    reactRefresh: boolean;

    /**
     * Gets the overwrite flag for copy assets build tool.
     */
    copyOverwrite: boolean;
}


/**
 * Contains all flags and settings for the instapack build tool.
 */
export interface BuildVariables extends UserSettings, ProjectSettings, CommandLineFlags {
    /**
     * Gets the TypeScript configuration JSON file.
     */
    typescriptConfiguration: unknown;
}

export function uniteBuildVariables(
    commandLineFlags: CommandLineFlags,
    projectSettings: ProjectSettings,
    userSettings: UserSettings,
    dotEnv: MapLike<string>,
    typescriptConfiguration: unknown
): BuildVariables {

    const a = Object.assign({
        typescriptConfiguration: typescriptConfiguration,
    }, userSettings);
    const b = Object.assign(a, projectSettings);
    const variables: BuildVariables = Object.assign(b, commandLineFlags);

    // CLI flags override .env file
    variables.env = Object.assign(dotEnv, commandLineFlags.env);

    if (variables.reactRefresh) {
        variables.serve = true;
    }

    if (variables.serve) {
        variables.production = false;
        variables.watch = true;
    }

    if (variables.watch) {
        variables.stats = false;
    }

    if (!variables.watch) {
        variables.mute = true;
    }

    return variables;
}