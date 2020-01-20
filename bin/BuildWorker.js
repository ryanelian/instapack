"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeScriptBuildEngine_1 = require("./TypeScriptBuildEngine");
const TypeScriptCheckerTool_1 = require("./TypeScriptCheckerTool");
const SassBuildTool_1 = require("./SassBuildTool");
const CopyBuildTool_1 = require("./CopyBuildTool");
const VoiceAssistant_1 = require("./VoiceAssistant");
const Shout_1 = require("./Shout");
async function jsWorker(variables) {
    const tool = new TypeScriptBuildEngine_1.TypeScriptBuildEngine(variables);
    await tool.build();
    while (variables.watch) { }
}
exports.jsWorker = jsWorker;
async function typeCheckWorker(variables) {
    const tool = await TypeScriptCheckerTool_1.TypeScriptCheckerTool.createToolAsync(variables);
    tool.typeCheck();
    if (variables.watch) {
        tool.watch();
        while (variables.watch) { }
    }
}
exports.typeCheckWorker = typeCheckWorker;
async function cssWorker(variables) {
    const tool = new SassBuildTool_1.SassBuildTool(variables);
    await tool.buildWithStopwatch();
    if (variables.watch) {
        tool.watch();
        while (variables.watch) { }
    }
}
exports.cssWorker = cssWorker;
async function copyWorker(variables) {
    const tool = new CopyBuildTool_1.CopyBuildTool(variables);
    await tool.buildWithStopwatch();
}
exports.copyWorker = copyWorker;
const buildMaps = {};
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
if (process.send) {
    process.on('message', (param) => {
        const meta = buildMaps[param.build];
        const va = new VoiceAssistant_1.VoiceAssistant(param.variables.mute);
        meta.worker(param.variables).then(() => {
            process.exit();
        }).catch(err => {
            Shout_1.Shout.fatal(`during ${meta.commandLineName} build:`, err);
            va.speak(meta.voicedName + ' FATAL ERROR!');
            process.exit();
        });
    });
}
