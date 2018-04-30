"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const Settings_1 = require("../Settings");
const ConcatBuildTool_1 = require("../ConcatBuildTool");
module.exports = function (input, finish) {
    return __awaiter(this, void 0, void 0, function* () {
        let settings = new Settings_1.Settings(input.root, input.settings);
        let tool = new ConcatBuildTool_1.ConcatBuildTool(settings, input.flags);
        try {
            yield tool.buildWithStopwatch();
            finish(null);
        }
        catch (error) {
            finish(error);
        }
    });
};
