import * as fse from 'fs-extra';

import { TypeScriptBuildEngine } from "../TypeScriptBuildEngine";
import { Shout } from "../Shout";
import { IVariables } from "../variables-factory/IVariables";
import { setVariablesPorts } from "../PortFinder";
import { PathFinder } from "../variables-factory/PathFinder";

/**
 * Accepts build task command as input parameter then run TypeScript build tool.
 */
export = async function (variables: IVariables, finish) {

    if (variables.verbose) {
        Shout.displayVerboseOutput = true;
    }

    if (variables.muteNotification) {
        Shout.enableNotification = false;
    }

    let finder = new PathFinder(variables);
    let useBabel = fse.pathExists(finder.babelConfiguration);

    if (variables.hot) {
        await setVariablesPorts(variables);
    }

    let tool = new TypeScriptBuildEngine(variables, await useBabel);

    try {
        await tool.build();
        if (!variables.watch) {
            finish(null);
        }
    } catch (error) {
        finish(error);
    }
}
