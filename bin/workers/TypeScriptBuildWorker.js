"use strict";
const TypeScriptBuildEngine_1 = require("../TypeScriptBuildEngine");
module.exports = async function (variables, finish) {
    const tool = new TypeScriptBuildEngine_1.TypeScriptBuildEngine(variables);
    try {
        await tool.build();
        if (!variables.watch) {
            finish(null);
        }
    }
    catch (error) {
        finish(error);
    }
};
