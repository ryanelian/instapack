import * as fse from 'fs-extra';
import * as upath from 'upath';
import * as TypeScript from 'typescript';
import { Shout } from './Shout';
import chalk from 'chalk';

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

export async function tryReadTypeScriptConfigJson(folder: string) {
    let tsconfigJsonPath = upath.join(folder, 'tsconfig.json');

    try {
        let tsconfigJson = await fse.readJson(tsconfigJsonPath);
        let parse = parseTypescriptConfig(folder, tsconfigJson);
        if (parse.options.target !== TypeScript.ScriptTarget.ES5) {
            Shout.warning('TypeScript build', chalk.cyan('target'), 'is not', chalk.yellow('ES5') + '!');
        }

        return tsconfigJson;
    } catch (error) {
        Shout.error('when reading', chalk.cyan(tsconfigJsonPath), error);
        Shout.warning('Using the default fallback TypeScript configuration!');
        return fallbackTypeScriptConfig;
    }
}

export function parseTypescriptConfig(folder: string, json: any): TypeScript.ParsedCommandLine {
    // apparently TypeScript.parseJsonConfigFileContent modifies the input object!
    // deep copy the object for unit test sanity...
    let o = JSON.parse(JSON.stringify(json));

    // https://github.com/Microsoft/TypeScript/blob/master/src/compiler/commandLineParser.ts#L992
    let tsconfig = TypeScript.parseJsonConfigFileContent(o, TypeScript.sys, folder);
    if (tsconfig.errors.length) {
        throw Error(tsconfig.errors[0].messageText.toString());
    }
    // console.log(tsconfig);
    return tsconfig;
}
