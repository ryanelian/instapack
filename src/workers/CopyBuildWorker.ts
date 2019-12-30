import { BuildVariables } from "../variables-factory/BuildVariables";
import { CopyBuildTool } from "../CopyBuildTool";

export = async function (variables: BuildVariables, finish): Promise<void> {
    const tool = new CopyBuildTool(variables);

    try {
        await tool.buildWithStopwatch();
        finish(null);
    } catch (error) {
        finish(error);
    }
}
