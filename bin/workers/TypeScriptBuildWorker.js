"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const fse = require("fs-extra");
const TypeScriptBuildEngine_1 = require("../TypeScriptBuildEngine");
const Shout_1 = require("../Shout");
const PortFinder_1 = require("../PortFinder");
const PathFinder_1 = require("../variables-factory/PathFinder");
module.exports = function (variables, finish) {
    return __awaiter(this, void 0, void 0, function* () {
        if (variables.verbose) {
            Shout_1.Shout.displayVerboseOutput = true;
        }
        if (variables.muteNotification) {
            Shout_1.Shout.enableNotification = false;
        }
        let finder = new PathFinder_1.PathFinder(variables);
        let useBabel = fse.pathExists(finder.babelConfiguration);
        if (variables.hot) {
            yield PortFinder_1.setVariablesPorts(variables);
        }
        let tool = new TypeScriptBuildEngine_1.TypeScriptBuildEngine(variables, yield useBabel);
        try {
            yield tool.build();
            if (!variables.watch) {
                finish(null);
            }
        }
        catch (error) {
            finish(error);
        }
    });
};
