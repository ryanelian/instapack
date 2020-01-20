
import { BuildVariables } from "./variables-factory/BuildVariables";
import { BuildWorkerParameters } from "./BuildWorkerParameters";
import { TypeScriptBuildEngine } from "./TypeScriptBuildEngine";
import { TypeScriptCheckerTool } from "./TypeScriptCheckerTool";
import { SassBuildTool } from "./SassBuildTool";
import { CopyBuildTool } from "./CopyBuildTool";
import { VoiceAssistant } from './VoiceAssistant';
import { Shout } from "./Shout";

export async function jsWorker(variables: BuildVariables): Promise<void> {
    const tool = new TypeScriptBuildEngine(variables);
    await tool.build();
    while (variables.watch) { /* stay alive */ }
}

export async function typeCheckWorker(variables: BuildVariables): Promise<void> {
    const tool = await TypeScriptCheckerTool.createToolAsync(variables);
    tool.typeCheck();
    if (variables.watch) {
        tool.watch();
        while (variables.watch) { /* stay alive */ }
    }
}

export async function cssWorker(variables: BuildVariables): Promise<void> {
    const tool = new SassBuildTool(variables);

    await tool.buildWithStopwatch();
    if (variables.watch) {
        tool.watch();
        while (variables.watch) { /* stay alive */ }
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

const buildMaps: MapLike<BuildWorkerMetadata> = {};
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

// is forked process:
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
