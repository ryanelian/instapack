import { TypeScriptBuildEngine } from "../TypeScriptBuildEngine";
import { Shout } from "../Shout";
import { IVariables } from "../variables-factory/IVariables";
import portfinder = require('portfinder');

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

    if (variables.hot) {
        let basePort = variables.port1;
        if (!basePort) {
            basePort = 28080;
        }
        let port = await portfinder.getPortPromise({
            port: basePort
        });
        variables.port1 = port;
    }

    let tool = new TypeScriptBuildEngine(variables);
    try {
        await tool.build();
        if (!variables.watch) {
            finish(null);
        }
    } catch (error) {
        finish(error);
    }
}
