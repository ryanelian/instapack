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
Object.defineProperty(exports, "__esModule", { value: true });
const fse = require("fs-extra");
const upath = require("upath");
const TypeScript = require("typescript");
const Shout_1 = require("./Shout");
const chalk = require("chalk");
const fallbackTypeScriptConfig = {
    compilerOptions: {
        alwaysStrict: true,
        skipLibCheck: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        jsx: "react",
        target: "es2016",
        module: "esnext",
        moduleResolution: "node",
        lib: [
            "dom",
            "es2016",
            "dom.iterable"
        ]
    }
};
function parseTypescriptConfig(folder, json) {
    const o = JSON.parse(JSON.stringify(json));
    const tsconfig = TypeScript.parseJsonConfigFileContent(o, TypeScript.sys, folder);
    if (tsconfig.errors.length) {
        throw Error(tsconfig.errors[0].messageText.toString());
    }
    return tsconfig;
}
exports.parseTypescriptConfig = parseTypescriptConfig;
function tryReadTypeScriptConfigJson(folder) {
    return __awaiter(this, void 0, void 0, function* () {
        const tsconfigJsonPath = upath.join(folder, 'tsconfig.json');
        try {
            const tsconfigJson = yield fse.readJson(tsconfigJsonPath);
            const tryParse = parseTypescriptConfig(folder, tsconfigJson);
            const errorMessage = tryParse.errors.join('\n\n');
            if (tryParse.errors.length) {
                throw new Error(errorMessage);
            }
            return tsconfigJson;
        }
        catch (error) {
            Shout_1.Shout.error('when reading', chalk.cyan(tsconfigJsonPath), error);
            Shout_1.Shout.warning('Using the default fallback TypeScript configuration!');
            return fallbackTypeScriptConfig;
        }
    });
}
exports.tryReadTypeScriptConfigJson = tryReadTypeScriptConfigJson;
