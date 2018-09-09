import { Shout } from "../Shout";
import { SassBuildTool } from "../SassBuildTool";
import { IVariables } from "../interfaces/IVariables";

/**
 * Accepts build task command as input parameter then run Sass build tool.
 * If watch mode is detected, do not send task completion signal to worker farm.
 */
export = async function (variables: IVariables, finish) {

    if (variables.verbose) {
        Shout.displayVerboseOutput = true;
    }

    if (variables.muteNotification) {
        Shout.enableNotification = false;
    }

    let tool = new SassBuildTool(variables);

    try {
        await tool.buildWithStopwatch();
        if (variables.watch) {
            tool.watch();
        } else {
            finish(null);
        }
    } catch (error) {
        finish(error);
    }
}
