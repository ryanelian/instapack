import { Settings } from "../Settings";
import { Shout } from "../Shout";
import { SassBuildTool } from "../SassBuildTool";

/**
 * Accepts build task command as input parameter then run Sass build tool.
 * If watch mode is detected, do not send task completion signal to worker farm.
 */
export = async function (input: IBuildCommand, finish) {
    if (input.flags.watch) {
        Shout.enableNotification = input.flags.notification;
    }

    let settings = new Settings(input.root, input.settings);
    let tool = new SassBuildTool(settings, input.flags);

    try {
        await tool.buildWithStopwatch();
        if (input.flags.watch) {
            tool.watch();
        } else {
            finish(null);
        }
    } catch (error) {
        finish(error);
    }
}
