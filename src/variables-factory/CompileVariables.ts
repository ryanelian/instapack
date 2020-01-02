import { BuildVariables } from "./BuildVariables";
import { CommandLineFlags } from "./CommandLineFlags";
import { ProjectSettings } from "./ProjectSettings";
import { UserSettings } from "../user-settings/UserSettings";

export function compileVariables(
    buildFlags: CommandLineFlags,
    projectSettings: ProjectSettings,
    userSettings: UserSettings,
    dotEnv: NodeJS.ProcessEnv,
    typescriptConfiguration: unknown): BuildVariables {

    const variables: BuildVariables = {
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

        packageManager: userSettings.packageManager,
        mute: userSettings.mute,

        production: buildFlags.production,
        sourceMap: buildFlags.sourceMap,
        watch: buildFlags.watch,
        stats: buildFlags.stats,

        serve: buildFlags.serve,
        port1: projectSettings.port1,
        https: buildFlags.https,
        typescriptConfiguration: typescriptConfiguration
    };

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
