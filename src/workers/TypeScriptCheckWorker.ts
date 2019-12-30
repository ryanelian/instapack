import { TypeScriptCheckerTool } from "../TypeScriptCheckerTool";
import { BuildVariables } from "../variables-factory/BuildVariables";

/**
 * Accepts build task command as input parameter then run TypeScript check tool.
 * If watch mode is detected, do not send task completion signal to worker farm.
 */
export = async function (variables: BuildVariables, finish): Promise<void> {
    const tool = await TypeScriptCheckerTool.createToolAsync(variables);

    try {
        tool.typeCheck();
        if (variables.watch) {
            tool.watch();
        } else {
            finish(null);
        }
    } catch (error) {
        finish(error);
    }
}
