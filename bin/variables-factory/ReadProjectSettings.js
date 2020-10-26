"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readProjectSettingsFrom = void 0;
const fse = require("fs-extra");
const upath = require("upath");
const Ajv = require("ajv");
const Shout_1 = require("../Shout");
const settingsJsonSchemaPath = require.resolve('../../schemas/settings.json');
async function tryReadPackageJson(path) {
    try {
        const packageJson = await fse.readJson(path);
        if (!packageJson) {
            return undefined;
        }
        return packageJson;
    }
    catch (error) {
        return undefined;
    }
}
async function readPackageVersion(packageName, root) {
    try {
        const packageJsonPath = upath.toUnix(require.resolve(packageName + "/package.json", {
            paths: [root]
        }));
        if (packageJsonPath.startsWith(root) === false) {
            return undefined;
        }
        const packageJson = await fse.readJson(packageJsonPath);
        return packageJson.version;
    }
    catch (err) {
        return undefined;
    }
}
async function readProjectSettingsFrom(folder) {
    const settings = {
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
        vue: undefined,
        port1: 0
    };
    const packageJsonPath = upath.join(folder, 'package.json');
    const packageJson = await tryReadPackageJson(packageJsonPath);
    if (!packageJson) {
        return settings;
    }
    const ajv = new Ajv();
    const settingsJsonSchema = await fse.readJson(settingsJsonSchemaPath);
    const validate = ajv.compile(settingsJsonSchema);
    if (packageJson.instapack) {
        if (validate(packageJson.instapack) === false) {
            Shout_1.Shout.fatal('Abort Build: Invalid instapack project settings in ' + packageJsonPath);
            console.error(validate.errors);
            throw new Error('Invalid instapack project settings!');
        }
        Object.assign(settings, packageJson.instapack);
        settings.cssOut = upath.addExt(settings.cssOut, '.css');
        settings.jsOut = upath.addExt(settings.jsOut, '.js');
    }
    const vue = await readPackageVersion('vue', folder);
    if (vue) {
        settings.vue = {
            vue: vue,
            loader: await readPackageVersion('vue-loader', folder),
            compilerService: undefined
        };
        if (vue.startsWith('2')) {
            settings.vue.compilerService = await readPackageVersion('vue-template-compiler', folder);
        }
        else if (vue.startsWith('3')) {
            settings.vue.compilerService = await readPackageVersion('@vue/compiler-sfc', folder);
        }
        else {
            throw new Error(`Unknown Vue version: ${vue}`);
        }
    }
    return settings;
}
exports.readProjectSettingsFrom = readProjectSettingsFrom;
