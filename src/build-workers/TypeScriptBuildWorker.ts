import { Settings } from "../Settings";
import { TypeScriptBuildTool } from "../TypeScriptBuildTool";
import { Shout } from "../Shout";

/**
 * Accepts build task command as input parameter then run TypeScript build tool.
 */
export = async function (input: IBuildCommand, finish) {
    if (input.flags.watch) {
        Shout.enableNotification = input.flags.notification;
    }

    let settings = new Settings(input.root, input.settings);
    let tool = new TypeScriptBuildTool(settings, input.flags);

    try {
        await tool.build();
        // Promise will never finish if runs on watch mode!
        finish(null);
    } catch (error) {
        finish(error);
    }
}
