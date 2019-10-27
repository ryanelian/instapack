import * as fse from 'fs-extra';
import * as upath from 'upath';
import { IProjectSettings } from './IProjectSettings';
import Ajv = require('ajv');
const settingsJsonSchemaPath = require.resolve('../../schemas/instapack-settings.json');

async function tryReadPackageJsonInstapackSettings(path: string): Promise<unknown> {
    try {
        let packageJson = await fse.readJson(path);
        let x = packageJson.instapack;
        if (!x) {
            return {};
        }

        return x;
    } catch (ex) {
        return {};
    }
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

    let ajv = new Ajv();
    let settingsJsonSchema = await fse.readJson(settingsJsonSchemaPath);
    let validate = ajv.compile(settingsJsonSchema);

    let packageJsonPath = upath.join(folder, 'package.json');
    // console.log('Loading settings ' + chalk.cyan(json));

    let x = await tryReadPackageJsonInstapackSettings(packageJsonPath);
    // console.log(x);

    let valid = validate(x);
    if (valid === false) {
        console.error('Abort build: Invalid instapack project settings in ' + packageJsonPath);
        console.error(validate.errors);
        throw new Error('Invalid instapack project settings!');
    }

    Object.assign(settings, x);
    // console.log(settings);
    return settings;
}
