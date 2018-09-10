import fse from 'fs-extra';
import upath from 'upath';
import dotenv from 'dotenv';

import { IVariables } from "./interfaces/IVariables";
import { ICommandLineFlags } from "./interfaces/ICommandLineFlags";
import { IProjectSettings } from "./interfaces/IProjectSettings";
import { IUserSettings } from "./interfaces/IUserSettings";
import { IMapLike } from './interfaces/IMapLike';

export class VariablesFactory {

    compile(
        buildFlags: ICommandLineFlags,
        projectSettings: IProjectSettings,
        userSettings: IUserSettings,
        dotEnv: NodeJS.ProcessEnv): IVariables {

        let variables: IVariables = {
            root: projectSettings.root,
            input: projectSettings.input,
            output: projectSettings.output,
            jsOut: projectSettings.jsOut,
            cssOut: projectSettings.cssOut,

            alias: projectSettings.alias,
            externals: projectSettings.externals,
            env: Object.assign(dotEnv, buildFlags.env),

            packageManager: userSettings.packageManager,
            muteNotification: userSettings.muteNotification,

            production: buildFlags.production,
            sourceMap: buildFlags.sourceMap,
            watch: buildFlags.watch,
            stats: buildFlags.stats,
            verbose: buildFlags.verbose,

            hot: buildFlags.hot,
            port1: projectSettings.port1,
            port2: projectSettings.port2,
        };

        if (variables.hot) {
            variables.production = false;
            variables.watch = true;
        }

        if (variables.production === false || variables.watch) {
            variables.stats = false;
        }

        return variables;
    }

    isValidExternals(value): boolean {
        // https://webpack.js.org/configuration/externals/#externals

        if (!value) {
            return false;
        }

        if (typeof value === 'string') {
            return true;
        }

        if (Array.isArray(value)) {
            return value.every(item => typeof item === 'string');
        } else if (typeof value === 'object') {
            // properties should be object or array of string, too lazy to validate
            return true;
        }

        return false;
    }

    async readProjectSettingsFrom(folder: string): Promise<IProjectSettings> {
        let settings: IProjectSettings = {
            root: upath.toUnix(folder),
            input: 'client',
            output: 'wwwroot',
            jsOut: 'ipack.js',
            cssOut: 'ipack.css',

            alias: {},
            externals: {},
            port1: 0,
            port2: 0
        };

        let parse: any;

        try {
            let jsonPath = upath.join(folder, 'package.json');
            // console.log('Loading settings ' + chalk.cyan(json));
            let json = await fse.readJson(jsonPath);
            parse = json.instapack;
        } catch (ex) {
            // console.log('Failed to load settings. Using default settings.');
        }

        if (parse) {
            if (typeof parse.input === 'string') {
                settings.input = parse.input;
            }

            if (typeof parse.output === 'string') {
                settings.output = parse.output;
            }

            if (typeof parse.jsOut === 'string') {
                let s = upath.addExt(parse.jsOut, '.js');
                settings.jsOut = s;
            }

            if (typeof parse.cssOut === 'string') {
                let s = upath.addExt(parse.cssOut, '.css');
                settings.cssOut = s;
            }

            if (Number.isInteger(parse.port1)) {
                settings.port1 = parse.port1;
            }

            if (Number.isInteger(parse.port2)) {
                settings.port2 = parse.port2;
            }

            if (typeof parse.alias === 'object') {
                for (let key in parse.alias) {
                    let value = parse.alias[key];
                    // https://webpack.js.org/configuration/resolve/#resolve-alias
                    if (typeof value === 'string') {
                        settings.alias[key] = value;
                    }
                }
            }

            if (typeof parse.externals === 'object') {
                for (let key in parse.externals) {
                    let value = parse.externals[key];
                    if (this.isValidExternals(value)) {
                        settings.externals[key] = value;
                    }
                }
            }
        }

        return settings;
    }

    /**
     * Attempt to parse .env file in the folder.
     */
    async readDotEnvFrom(folder: string): Promise<IMapLike<string>> {
        let file = upath.join(folder, '.env');

        if (await fse.pathExists(file) === false) {
            return {};
        };

        let dotEnvRaw = await fse.readFile(file, 'utf8');
        return dotenv.parse(dotEnvRaw);
    }

    parseCliEnv(yargsEnv: any): any {
        // console.log(yargsEnv);

        let env: IMapLike<string> = {};
        if (yargsEnv && typeof yargsEnv === 'object' && Array.isArray(yargsEnv) === false) {
            for (let key in yargsEnv) {
                env[key] = yargsEnv[key].toString();
            }
            // console.log(cliEnv);
        }
        return env;
    }
}
