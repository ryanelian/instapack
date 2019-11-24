import { Shout } from "../Shout";
import { BuildVariables } from "../variables-factory/BuildVariables";
import { CopyBuildTool } from "../CopyBuildTool";

export = async function (variables: BuildVariables, finish) {

    if (variables.verbose) {
        Shout.displayVerboseOutput = true;
    }

    const tool = new CopyBuildTool(variables);

    try {
        await tool.buildWithStopwatch();
        finish(null);
    } catch (error) {
        finish(error);
    }
}
