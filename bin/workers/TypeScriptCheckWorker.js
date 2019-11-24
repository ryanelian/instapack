"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const Shout_1 = require("../Shout");
const TypeScriptCheckerTool_1 = require("../TypeScriptCheckerTool");
module.exports = function (variables, finish) {
    return __awaiter(this, void 0, void 0, function* () {
        if (variables.verbose) {
            Shout_1.Shout.displayVerboseOutput = true;
        }
        const tool = yield TypeScriptCheckerTool_1.TypeScriptCheckerTool.createToolAsync(variables);
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
    });
};
