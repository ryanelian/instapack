"use strict";
const TypeScriptCheckerTool_1 = require("../TypeScriptCheckerTool");
module.exports = async function (variables, finish) {
    const tool = await TypeScriptCheckerTool_1.TypeScriptCheckerTool.createToolAsync(variables);
    try {
        tool.typeCheck();
        if (variables.watch) {
            tool.watch();
        }
        else {
            finish(null);
        }
    }
    catch (error) {
        finish(error);
    }
};
