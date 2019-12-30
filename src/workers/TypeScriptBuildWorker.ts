import { TypeScriptBuildEngine } from "../TypeScriptBuildEngine";
import { BuildVariables } from "../variables-factory/BuildVariables";

/**
 * Accepts build task command as input parameter then run TypeScript build tool.
 */
export = async function (variables: BuildVariables, finish): Promise<void> {
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
