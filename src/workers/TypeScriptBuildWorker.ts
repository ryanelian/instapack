import { TypeScriptBuildEngine } from "../TypeScriptBuildEngine";
import { Shout } from "../Shout";
import { IVariables } from "../variables-factory/IVariables";

/**
 * Accepts build task command as input parameter then run TypeScript build tool.
 */
export = async function (variables: IVariables, finish) {

    if (variables.verbose) {
        Shout.displayVerboseOutput = true;
    }

    if (variables.muteNotification) {
        Shout.enableNotification = false;
    }

    let tool = new TypeScriptBuildEngine(variables);

    try {
        await tool.build();
        if (!variables.watch) {
            finish(null);
        }
    } catch (error) {
        finish(error);
    }
}
