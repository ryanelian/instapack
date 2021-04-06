/**
 * Stats options object.
 */
interface WebpackStatsOptions {
    /**
     * Fallback value for stats options when an option is not defined (has precedence over local webpack defaults).
     */
    all?: boolean;

    /**
     * Add assets information.
     */
    assets?: boolean;

    /**
     * Sort the assets by that field.
     */
    assetsSort?: string;

    /**
     * Space to display assets (groups will be collapsed to fit this space).
     */
    assetsSpace?: number;

    /**
     * Add built at time information.
     */
    builtAt?: boolean;

    /**
     * Add information about cached (not built) modules (deprecated: use 'cachedModules' instead).
     */
    cached?: boolean;

    /**
     * Show cached assets (setting this to `false` only shows emitted files).
     */
    cachedAssets?: boolean;

    /**
     * Add information about cached (not built) modules.
     */
    cachedModules?: boolean;

    /**
     * Add children information.
     */
    children?: boolean;

    /**
     * Display auxiliary assets in chunk groups.
     */
    chunkGroupAuxiliary?: boolean;

    /**
     * Display children of chunk groups.
     */
    chunkGroupChildren?: boolean;

    /**
     * Limit of assets displayed in chunk groups.
     */
    chunkGroupMaxAssets?: number;

    /**
     * Display all chunk groups with the corresponding bundles.
     */
    chunkGroups?: boolean;

    /**
     * Add built modules information to chunk information.
     */
    chunkModules?: boolean;

    /**
     * Space to display chunk modules (groups will be collapsed to fit this space, value is in number of modules/group).
     */
    chunkModulesSpace?: number;

    /**
     * Add the origins of chunks and chunk merging info.
     */
    chunkOrigins?: boolean;

    /**
     * Add information about parent, children and sibling chunks to chunk information.
     */
    chunkRelations?: boolean;

    /**
     * Add chunk information.
     */
    chunks?: boolean;

    /**
     * Sort the chunks by that field.
     */
    chunksSort?: string;

    /**
     * Enables/Disables colorful output.
     */
    colors?:
    | boolean
    | {
        /**
         * Custom color for bold text.
         */
        bold?: string;
        /**
         * Custom color for cyan text.
         */
        cyan?: string;
        /**
         * Custom color for green text.
         */
        green?: string;
        /**
         * Custom color for magenta text.
         */
        magenta?: string;
        /**
         * Custom color for red text.
         */
        red?: string;
        /**
         * Custom color for yellow text.
         */
        yellow?: string;
    };

    /**
     * Context directory for request shortening.
     */
    context?: string;

    /**
     * Show chunk modules that are dependencies of other modules of the chunk.
     */
    dependentModules?: boolean;

    /**
     * Add module depth in module graph.
     */
    depth?: boolean;

    /**
     * Display the entry points with the corresponding bundles.
     */
    entrypoints?: boolean | "auto";

    /**
     * Add --env information.
     */
    env?: boolean;

    /**
     * Add details to errors (like resolving log).
     */
    errorDetails?: boolean | "auto";

    /**
     * Add internal stack trace to errors.
     */
    errorStack?: boolean;

    /**
     * Add errors.
     */
    errors?: boolean;

    /**
     * Add errors count.
     */
    errorsCount?: boolean;

    /**
     * Please use excludeModules instead.
     */
    exclude?:
    | string
    | boolean
    | RegExp
    | ModuleFilterItemTypes[]
    | ((
        name: string,
        module: StatsModule,
        type: "module" | "chunk" | "root-of-chunk" | "nested"
    ) => boolean);

    /**
     * Suppress assets that match the specified filters. Filters can be Strings, RegExps or Functions.
     */
    excludeAssets?:
    | string
    | RegExp
    | AssetFilterItemTypes[]
    | ((name: string, asset: StatsAsset) => boolean);

    /**
     * Suppress modules that match the specified filters. Filters can be Strings, RegExps, Booleans or Functions.
     */
    excludeModules?:
    | string
    | boolean
    | RegExp
    | ModuleFilterItemTypes[]
    | ((
        name: string,
        module: StatsModule,
        type: "module" | "chunk" | "root-of-chunk" | "nested"
    ) => boolean);

    /**
     * Group assets by how their are related to chunks.
     */
    groupAssetsByChunk?: boolean;

    /**
     * Group assets by their status (emitted, compared for emit or cached).
     */
    groupAssetsByEmitStatus?: boolean;

    /**
     * Group assets by their extension.
     */
    groupAssetsByExtension?: boolean;

    /**
     * Group assets by their asset info (immutable, development, hotModuleReplacement, etc).
     */
    groupAssetsByInfo?: boolean;

    /**
     * Group assets by their path.
     */
    groupAssetsByPath?: boolean;

    /**
     * Group modules by their attributes (errors, warnings, assets, optional, orphan, or dependent).
     */
    groupModulesByAttributes?: boolean;

    /**
     * Group modules by their status (cached or built and cacheable).
     */
    groupModulesByCacheStatus?: boolean;

    /**
     * Group modules by their extension.
     */
    groupModulesByExtension?: boolean;

    /**
     * Group modules by their layer.
     */
    groupModulesByLayer?: boolean;

    /**
     * Group modules by their path.
     */
    groupModulesByPath?: boolean;

    /**
     * Group modules by their type.
     */
    groupModulesByType?: boolean;

    /**
     * Add the hash of the compilation.
     */
    hash?: boolean;

    /**
     * Add ids.
     */
    ids?: boolean;

    /**
     * Add logging output.
     */
    logging?: boolean | "none" | "verbose" | "error" | "warn" | "info" | "log";

    /**
     * Include debug logging of specified loggers (i. e. for plugins or loaders). Filters can be Strings, RegExps or Functions.
     */
    loggingDebug?:
    | string
    | boolean
    | RegExp
    | FilterItemTypes[]
    | ((value: string) => boolean);

    /**
     * Add stack traces to logging output.
     */
    loggingTrace?: boolean;

    /**
     * Add information about assets inside modules.
     */
    moduleAssets?: boolean;

    /**
     * Add dependencies and origin of warnings/errors.
     */
    moduleTrace?: boolean;

    /**
     * Add built modules information.
     */
    modules?: boolean;

    /**
     * Sort the modules by that field.
     */
    modulesSort?: string;

    /**
     * Space to display modules (groups will be collapsed to fit this space, value is in number of modules/groups).
     */
    modulesSpace?: number;

    /**
     * Add information about modules nested in other modules (like with module concatenation).
     */
    nestedModules?: boolean;

    /**
     * Space to display modules nested within other modules (groups will be collapsed to fit this space, value is in number of modules/group).
     */
    nestedModulesSpace?: number;

    /**
     * Show reasons why optimization bailed out for modules.
     */
    optimizationBailout?: boolean;

    /**
     * Add information about orphan modules.
     */
    orphanModules?: boolean;

    /**
     * Add output path information.
     */
    outputPath?: boolean;

    /**
     * Add performance hint flags.
     */
    performance?: boolean;

    /**
     * Preset for the default values.
     */
    preset?: string | boolean;

    /**
     * Show exports provided by modules.
     */
    providedExports?: boolean;

    /**
     * Add public path information.
     */
    publicPath?: boolean;

    /**
     * Add information about the reasons why modules are included.
     */
    reasons?: boolean;

    /**
     * Add information about assets that are related to other assets (like SourceMaps for assets).
     */
    relatedAssets?: boolean;

    /**
     * Add information about runtime modules (deprecated: use 'runtimeModules' instead).
     */
    runtime?: boolean;

    /**
     * Add information about runtime modules.
     */
    runtimeModules?: boolean;

    /**
     * Add the source code of modules.
     */
    source?: boolean;

    /**
     * Add timing information.
     */
    timings?: boolean;

    /**
     * Show exports used by modules.
     */
    usedExports?: boolean;

    /**
     * Add webpack version information.
     */
    version?: boolean;

    /**
     * Add warnings.
     */
    warnings?: boolean;

    /**
     * Add warnings count.
     */
    warningsCount?: boolean;

    /**
     * Suppress listing warnings that match the specified filters (they will still be counted). Filters can be Strings, RegExps or Functions.
     */
    warningsFilter?:
    | string
    | RegExp
    | WarningFilterItemTypes[]
    | ((warning: StatsError, value: string) => boolean);
}