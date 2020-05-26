
import { BuildVariables } from "./variables-factory/BuildVariables";
import { BuildWorkerParameters } from "./BuildWorkerParameters";
import { TypeScriptBuildEngine } from "./TypeScriptBuildEngine";
import { TypeScriptCheckerTool } from "./TypeScriptCheckerTool";
import { SassBuildTool } from "./SassBuildTool";
import { CopyBuildTool } from "./CopyBuildTool";
import { VoiceAssistant } from './VoiceAssistant';
import { Shout } from "./Shout";

async function stayAlive(): Promise<never> {
    return new Promise<never>(() => {
        /* never resolve to allow build workers to run forever */
    });
}

export async function jsWorker(variables: BuildVariables): Promise<void> {
    const tool = new TypeScriptBuildEngine(variables);
    await tool.build();
    if (variables.watch) {
        await stayAlive();
    }
}

export async function typeCheckWorker(variables: BuildVariables): Promise<void> {
    const tool = await TypeScriptCheckerTool.createToolAsync(variables);
    await tool.typeCheck();
    if (variables.watch) {
        tool.watch();
        await stayAlive();
    }
}

export async function cssWorker(variables: BuildVariables): Promise<void> {
    const tool = new SassBuildTool(variables);

    await tool.buildWithStopwatch();
    if (variables.watch) {
        tool.watch();
        await stayAlive();
    }
}

export async function copyWorker(variables: BuildVariables): Promise<void> {
    const tool = new CopyBuildTool(variables);
    await tool.buildWithStopwatch();
}

interface BuildWorkerMetadata {
    worker: (variables: BuildVariables) => Promise<void>;
    commandLineName: string;
    voicedName: string;
}

const buildMaps: Record<string, BuildWorkerMetadata> = {};
buildMaps['js'] = {
    commandLineName: 'JS',
    voicedName: 'JAVA SCRIPT',
    worker: jsWorker
};
buildMaps['type-check'] = {
    commandLineName: 'type-check',
    voicedName: 'TYPE CHECK',
    worker: typeCheckWorker
};
buildMaps['css'] = {
    commandLineName: 'CSS',
    voicedName: 'CSS',
    worker: cssWorker
};
buildMaps['copy'] = {
    commandLineName: 'copy assets',
    voicedName: 'COPY ASSETS',
    worker: copyWorker
};

// run when child_process.fork:
if (process.send) {
    process.on('message', (param: BuildWorkerParameters) => {
        // console.log(param);
        const meta = buildMaps[param.build];

        const va = new VoiceAssistant(param.variables.mute);
        meta.worker(param.variables).then(() => {
            process.exit()
        }).catch(err => {
            Shout.fatal(`during ${meta.commandLineName} build:`, err);
            va.speak(meta.voicedName + ' FATAL ERROR!');
            process.exit();
        });
    });
}
