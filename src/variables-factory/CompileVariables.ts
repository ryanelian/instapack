import { IVariables } from "./IVariables";
import { ICommandLineFlags } from "./ICommandLineFlags";
import { IProjectSettings } from "./IProjectSettings";
import { IUserSettings } from "../user-settings/IUserSettings";

export function compileVariables(
    buildFlags: ICommandLineFlags,
    projectSettings: IProjectSettings,
    userSettings: IUserSettings,
    dotEnv: NodeJS.ProcessEnv,
    typescriptConfiguration: any): IVariables {

    let variables: IVariables = {
        root: projectSettings.root,
        input: projectSettings.input,
        output: projectSettings.output,
        jsOut: projectSettings.jsOut,
        cssOut: projectSettings.cssOut,

        alias: projectSettings.alias,
        externals: projectSettings.externals,
        env: Object.assign(dotEnv, buildFlags.env),

        packageManager: userSettings.packageManager,
        silent: userSettings.silent,

        production: buildFlags.production,
        sourceMap: buildFlags.sourceMap,
        watch: buildFlags.watch,
        stats: buildFlags.stats,
        verbose: buildFlags.verbose,

        hot: buildFlags.hot,
        port1: projectSettings.port1,
        typescriptConfiguration: typescriptConfiguration
    };

    if (variables.hot) {
        variables.production = false;
        variables.watch = true;
    }

    if (variables.production === false || variables.watch) {
        variables.stats = false;
    }

    if (variables.watch === false) {
        variables.silent = false;
    }

    return variables;
}
