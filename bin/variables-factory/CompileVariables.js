"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function compileVariables(buildFlags, projectSettings, userSettings, dotEnv, typescriptConfiguration) {
    const variables = {
        root: projectSettings.root,
        input: projectSettings.input,
        output: projectSettings.output,
        jsOut: projectSettings.jsOut,
        cssOut: projectSettings.cssOut,
        alias: projectSettings.alias,
        externals: projectSettings.externals,
        namespace: projectSettings.namespace,
        copy: projectSettings.copy,
        env: Object.assign(dotEnv, buildFlags.env),
        copyOverwrite: buildFlags.copyOverwrite,
        packageManager: userSettings.packageManager,
        mute: userSettings.mute,
        production: buildFlags.production,
        sourceMap: buildFlags.sourceMap,
        watch: buildFlags.watch,
        stats: buildFlags.stats,
        serve: buildFlags.serve,
        port1: projectSettings.port1,
        https: buildFlags.https,
        reactRefresh: buildFlags.reactRefresh,
        typescriptConfiguration: typescriptConfiguration
    };
    if (variables.reactRefresh) {
        variables.serve = true;
    }
    if (variables.serve) {
        variables.production = false;
        variables.watch = true;
    }
    if (variables.production === false || variables.watch) {
        variables.stats = false;
    }
    if (variables.watch === false) {
        variables.mute = true;
    }
    return variables;
}
exports.compileVariables = compileVariables;
