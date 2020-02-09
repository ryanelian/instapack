import * as fse from 'fs-extra';
import * as upath from 'upath';
import { ProjectSettings } from './BuildVariables';
import Ajv = require('ajv');
import { Shout } from '../Shout';
const settingsJsonSchemaPath = require.resolve('../../schemas/settings.json');

async function tryReadPackageJsonInstapackSettings(path: string): Promise<unknown> {
    try {
        const packageJson = await fse.readJson(path);
        const x = packageJson.instapack;
        if (!x) {
            return {};
        }

        return x;
    } catch (ex) {
        return {};
    }
}

export async function readProjectSettingsFrom(folder: string): Promise<ProjectSettings> {
    const settings: ProjectSettings = {
        root: upath.toUnix(folder),
        input: 'client',
        output: 'wwwroot',
        jsOut: 'ipack.js',
        cssOut: 'ipack.css',

        alias: {},
        externals: {},
        copy: [],
        namespace: undefined,
        umdLibraryMode: false,
        port1: 0
    };

    const ajv = new Ajv();
    const settingsJsonSchema = await fse.readJson(settingsJsonSchemaPath);
    const validate = ajv.compile(settingsJsonSchema);

    const packageJsonPath = upath.join(folder, 'package.json');
    // console.log('Loading settings ' + chalk.cyan(json));

    const x = await tryReadPackageJsonInstapackSettings(packageJsonPath);
    // console.log(x);

    const valid = validate(x);
    if (valid === false) {
        Shout.fatal('Abort Build: Invalid instapack project settings in ' + packageJsonPath);
        console.error(validate.errors);
        throw new Error('Invalid instapack project settings!');
    }

    Object.assign(settings, x);
    settings.cssOut = upath.addExt(settings.cssOut, '.css');
    settings.jsOut = upath.addExt(settings.jsOut, '.js');

    // console.log(settings);
    return settings;
}
