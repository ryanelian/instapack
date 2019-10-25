import * as fse from 'fs-extra';
import * as upath from 'upath';
import { IProjectSettings } from './IProjectSettings';
import { Shout } from '../Shout';

export function isValidExternals(value): boolean {
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

export async function readProjectSettingsFrom(folder: string): Promise<IProjectSettings> {
    let settings: IProjectSettings = {
        root: upath.toUnix(folder),
        input: 'client',
        output: 'wwwroot',
        jsOut: 'ipack.js',
        cssOut: 'ipack.css',

        alias: {},
        externals: {},
        copy: [],
        namespace: undefined,
        port1: 0,
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
                if (isValidExternals(value)) {
                    settings.externals[key] = value;
                }
            }
        }

        if (typeof parse.namespace === 'string') {
            settings.namespace = parse.namespace;
        }

        if (Array.isArray(parse.copy)) {
            for (let value of parse.copy) {
                if (typeof value === 'string') {
                    settings.copy.push(value);
                } else {
                    Shout.warning('package.json:instapack:copy non-string value ignored.');
                }
            }
        }
    }

    return settings;
}
