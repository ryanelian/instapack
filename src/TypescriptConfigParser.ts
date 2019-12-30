import * as fse from 'fs-extra';
import * as upath from 'upath';
import * as TypeScript from 'typescript';
import { Shout } from './Shout';
import chalk = require('chalk');

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

export function parseTypescriptConfig(folder: string, json: unknown): TypeScript.ParsedCommandLine {
    // apparently TypeScript.parseJsonConfigFileContent modifies the input object!
    // deep copy the object for unit test sanity...
    const o = JSON.parse(JSON.stringify(json));

    // https://github.com/Microsoft/TypeScript/blob/master/src/compiler/commandLineParser.ts#L992
    const tsconfig = TypeScript.parseJsonConfigFileContent(o, TypeScript.sys, folder);
    if (tsconfig.errors.length) {
        throw Error(tsconfig.errors[0].messageText.toString());
    }
    // console.log(tsconfig);
    return tsconfig;
}

export async function tryReadTypeScriptConfigJson(folder: string): Promise<unknown> {
    const tsconfigJsonPath = upath.join(folder, 'tsconfig.json');

    try {
        const tsconfigJson = await fse.readJson(tsconfigJsonPath);
        const tryParse = parseTypescriptConfig(folder, tsconfigJson);
        const errorMessage = tryParse.errors.join('\n\n');
        if (tryParse.errors.length) {
            throw new Error(errorMessage);
        }

        return tsconfigJson;
    } catch (error) {
        Shout.error('when reading', chalk.cyan(tsconfigJsonPath), error);
        Shout.warning('Using the default fallback TypeScript configuration!');
        return fallbackTypeScriptConfig;
    }
}
