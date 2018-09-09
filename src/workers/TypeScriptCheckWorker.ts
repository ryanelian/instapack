import { Shout } from "../Shout";
import { TypeScriptCheckerTool } from "../TypeScriptCheckerTool";
import { IVariables } from "../interfaces/IVariables";

/**
 * Accepts build task command as input parameter then run TypeScript check tool.
 * If watch mode is detected, do not send task completion signal to worker farm.
 */
export = async function (variables: IVariables, finish) {

    if (variables.verbose) {
        Shout.displayVerboseOutput = true;
    }

    if (variables.muteNotification) {
        Shout.enableNotification = false;
    }

    let tool = await TypeScriptCheckerTool.createToolAsync(variables);

    try {
        await tool.typeCheck();
        if (variables.watch) {
            tool.watch();
        } else {
            finish(null);
        }
    } catch (error) {
        finish(error);
    }
}
