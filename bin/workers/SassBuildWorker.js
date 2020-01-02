"use strict";
const SassBuildTool_1 = require("../SassBuildTool");
module.exports = async function (variables, finish) {
    const tool = new SassBuildTool_1.SassBuildTool(variables);
    try {
        await tool.buildWithStopwatch();
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
