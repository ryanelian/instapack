"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function uniteBuildVariables(commandLineFlags, projectSettings, userSettings, dotEnv, typescriptConfiguration) {
    const a = Object.assign({
        typescriptConfiguration: typescriptConfiguration,
    }, userSettings);
    const b = Object.assign(a, projectSettings);
    const variables = Object.assign(b, commandLineFlags);
    variables.env = Object.assign(dotEnv, commandLineFlags.env);
    if (variables.reactRefresh) {
        variables.serve = true;
    }
    if (variables.serve) {
        variables.production = false;
        variables.watch = true;
    }
    if (!variables.production || variables.watch) {
        variables.stats = false;
    }
    if (!variables.watch) {
        variables.mute = true;
    }
    return variables;
}
exports.uniteBuildVariables = uniteBuildVariables;
