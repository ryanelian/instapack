"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fse = require("fs-extra");
const upath = require("upath");
const TypeScript = require("typescript");
const Shout_1 = require("./Shout");
const chalk_1 = require("chalk");
let fallbackTypeScriptConfig = {
    compilerOptions: {
        alwaysStrict: true,
        skipLibCheck: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        jsx: "react",
        target: "es5",
        module: "esnext",
        moduleResolution: "node",
        lib: [
            "dom",
            "es5",
            "es2015.core",
            "es2015.promise"
        ]
    }
};
function tryReadTypeScriptConfigJson(folder) {
    return __awaiter(this, void 0, void 0, function* () {
        let tsconfigJsonPath = upath.join(folder, 'tsconfig.json');
        try {
            let tsconfigJson = yield fse.readJson(tsconfigJsonPath);
            let parse = parseTypescriptConfig(folder, tsconfigJson);
            if (parse.options.target !== TypeScript.ScriptTarget.ES5) {
                Shout_1.Shout.warning('TypeScript build', chalk_1.default.cyan('target'), 'is not', chalk_1.default.yellow('ES5') + '!');
            }
            return tsconfigJson;
        }
        catch (error) {
            Shout_1.Shout.error('when reading', chalk_1.default.cyan(tsconfigJsonPath), error);
            Shout_1.Shout.warning('Using the default fallback TypeScript configuration!');
            return fallbackTypeScriptConfig;
        }
    });
}
exports.tryReadTypeScriptConfigJson = tryReadTypeScriptConfigJson;
function parseTypescriptConfig(folder, json) {
    let o = JSON.parse(JSON.stringify(json));
    let tsconfig = TypeScript.parseJsonConfigFileContent(o, TypeScript.sys, folder);
    if (tsconfig.errors.length) {
        throw Error(tsconfig.errors[0].messageText.toString());
    }
    return tsconfig;
}
exports.parseTypescriptConfig = parseTypescriptConfig;
