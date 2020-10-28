import * as fse from 'fs-extra';
import * as upath from 'upath';
import { ProjectSettings } from './BuildVariables';
import Ajv = require('ajv');
import { Shout } from '../Shout';
const settingsJsonSchemaPath = require.resolve('../../schemas/settings.json');

interface PackageJson {
    version: string;
    instapack: unknown;
}

async function tryReadPackageJson(path: string): Promise<PackageJson | undefined> {
    try {
        const packageJson = await fse.readJson(path);
        if (!packageJson) {
            return undefined;
        }

        return packageJson as PackageJson;
    } catch (error) {
        return undefined;
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
        umdLibraryProject: false,
        port1: 0
    };

    const packageJsonPath = upath.join(folder, 'package.json');
    // console.log('Loading settings ' + chalk.cyanBright(json));

    const packageJson = await tryReadPackageJson(packageJsonPath);
    if (!packageJson) {
        return settings;
    }

    const ajv = new Ajv();
    const settingsJsonSchema = await fse.readJson(settingsJsonSchemaPath);
    const validate = ajv.compile(settingsJsonSchema);
    if (packageJson.instapack) {
        if (validate(packageJson.instapack) === false) {
            Shout.fatal('Abort Build: Invalid instapack project settings in ' + packageJsonPath);
            console.error(validate.errors);
            throw new Error('Invalid instapack project settings!');
        }

        // Object.assign mutates the target object properties
        Object.assign(settings, packageJson.instapack);
        settings.cssOut = upath.addExt(settings.cssOut, '.css');
        settings.jsOut = upath.addExt(settings.jsOut, '.js');
    }

    // console.log(settings);
    return settings;
}
