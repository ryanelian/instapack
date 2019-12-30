import { SassBuildTool } from "../SassBuildTool";
import { BuildVariables } from "../variables-factory/BuildVariables";

/**
 * Accepts build task command as input parameter then run Sass build tool.
 * If watch mode is detected, do not send task completion signal to worker farm.
 */
export = async function (variables: BuildVariables, finish): Promise<void> {
    const tool = new SassBuildTool(variables);

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
