"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryReadTypeScriptConfigJson = exports.parseTypescriptConfig = void 0;
const fse = require("fs-extra");
const upath = require("upath");
const TypeScript = require("typescript");
const Shout_1 = require("./Shout");
const chalk = require("chalk");
const fallbackTypeScriptConfig = {
    compilerOptions: {
        "target": "ES2015",
        "module": "ESNext",
        "lib": [
            "DOM",
            "DOM.Iterable",
            "ES2015",
        ],
        "resolveJsonModule": true,
        "jsx": "react",
        "importHelpers": false,
        "strict": true,
        "noImplicitAny": false,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "moduleResolution": "node",
        "allowSyntheticDefaultImports": true,
        "experimentalDecorators": true,
        "forceConsistentCasingInFileNames": true,
        "skipLibCheck": true
    }
};
function parseTypescriptConfig(folder, json) {
    const o = JSON.parse(JSON.stringify(json));
    const tsconfig = TypeScript.parseJsonConfigFileContent(o, TypeScript.sys, folder);
    if (tsconfig.errors.length) {
        const errorMessage = tsconfig.errors.map(Q => Q.messageText.toString()).join("\n\n");
        throw Error(errorMessage);
    }
    return tsconfig;
}
exports.parseTypescriptConfig = parseTypescriptConfig;
async function tryReadTypeScriptConfigJson(folder) {
    const tsconfigJsonPath = upath.join(folder, 'tsconfig.json');
    try {
        const tsconfigRaw = await fse.readFile(tsconfigJsonPath, 'utf8');
        const parse = TypeScript.parseConfigFileTextToJson(tsconfigJsonPath, tsconfigRaw);
        parseTypescriptConfig(folder, parse.config);
        return parse.config;
    }
    catch (error) {
        Shout_1.Shout.error('when reading', chalk.cyan(tsconfigJsonPath), error);
        Shout_1.Shout.warning('Using the default fallback TypeScript configuration!');
        console.log(fallbackTypeScriptConfig);
        return fallbackTypeScriptConfig;
    }
}
exports.tryReadTypeScriptConfigJson = tryReadTypeScriptConfigJson;
