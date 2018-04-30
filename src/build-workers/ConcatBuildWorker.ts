import { Settings } from "../Settings";
import { ConcatBuildTool } from "../ConcatBuildTool";

/**
 * Accepts build task command as input parameter then run JS concat build tool.
 */
export = async function (input: IBuildCommand, finish) {

    let settings = new Settings(input.root, input.settings);
    let tool = new ConcatBuildTool(settings, input.flags);

    try {
        await tool.buildWithStopwatch();
        finish(null);
    } catch (error) {
        finish(error);
    }
}
