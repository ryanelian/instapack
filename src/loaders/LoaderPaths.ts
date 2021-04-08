/**
 * Returns strongly-typed, absolute loader module paths.
 */
export const LoaderPaths = {
    typescript: require.resolve('./CoreTypeScriptLoader'),
    html: require.resolve('./HtmLoader'),
    babel: require.resolve('babel-loader'),
    css: require.resolve('css-loader'),
    transpileLibraries: require.resolve('./TranspileLibraryLoader')
}
