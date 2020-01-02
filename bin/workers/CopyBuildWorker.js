"use strict";
const CopyBuildTool_1 = require("../CopyBuildTool");
module.exports = async function (variables, finish) {
    const tool = new CopyBuildTool_1.CopyBuildTool(variables);
    try {
        await tool.buildWithStopwatch();
        finish(null);
    }
    catch (error) {
        finish(error);
    }
};
