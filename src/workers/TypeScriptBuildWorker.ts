import { TypeScriptBuildEngine } from "../TypeScriptBuildEngine";
import { Shout } from "../Shout";
import { BuildVariables } from "../variables-factory/BuildVariables";

/**
 * Accepts build task command as input parameter then run TypeScript build tool.
 */
export = async function (variables: BuildVariables, finish): Promise<void> {

    if (variables.verbose) {
        Shout.displayVerboseOutput = true;
    }

    const tool = new TypeScriptBuildEngine(variables);
    try {
        await tool.build();
        if (!variables.watch) {
            finish(null);
        }
    } catch (error) {
        finish(error);
    }
}
