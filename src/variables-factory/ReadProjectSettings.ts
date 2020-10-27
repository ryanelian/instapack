import * as fse from 'fs-extra';
import * as upath from 'upath';
import { ProjectSettings, VuePackageVersions } from './BuildVariables';
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

async function readPackageVersion(
    packageName: string,
    root: string
): Promise<string | undefined> {
    try {
        const packageJsonPath = upath.toUnix(
            require.resolve(packageName + "/package.json", {
                paths: [root]
            })
        );

        // do not go out from root folder!
        // console.log(packageJsonPath);
        if (packageJsonPath.startsWith(root) === false) {
            return undefined;
        }

        const packageJson = await fse.readJson(packageJsonPath);
        return packageJson.version;
    } catch (err) {
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

export async function readVuePackageVersionsFrom(folder: string): Promise<VuePackageVersions | undefined> {
    const vue = await readPackageVersion('vue', folder);
    if (!vue) {
        return undefined;
    }

    const versions: VuePackageVersions = {
        vue: vue,
        loader: await readPackageVersion('vue-loader', folder),
        compilerService: undefined
    }

    if (vue.startsWith('2')) {
        versions.compilerService = await readPackageVersion('vue-template-compiler', folder);
    } else if (vue.startsWith('3')) {
        versions.compilerService = await readPackageVersion('@vue/compiler-sfc', folder);
    } else {
        throw new Error(`Unknown Vue version: ${vue}`)
    }
    return versions;
}
