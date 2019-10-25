import { Shout } from "../Shout";
import { IVariables } from "../variables-factory/IVariables";
import { CopyBuildTool } from "../CopyBuildTool";

export = async function (variables: IVariables, finish) {

    if (variables.verbose) {
        Shout.displayVerboseOutput = true;
    }

    let tool = new CopyBuildTool(variables);

    try {
        await tool.buildWithStopwatch();
        finish(null);
    } catch (error) {
        finish(error);
    }
}
