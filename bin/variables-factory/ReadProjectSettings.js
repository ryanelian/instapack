"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readProjectSettingsFrom = void 0;
const fse = require("fs-extra");
const upath = require("upath");
const ajv_1 = require("ajv");
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
        port1: 0
    };
    const packageJsonPath = upath.join(folder, 'package.json');
    const packageJson = await tryReadPackageJson(packageJsonPath);
    if (!packageJson) {
        return settings;
    }
    const ajv = new ajv_1.default();
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
    return settings;
}
exports.readProjectSettingsFrom = readProjectSettingsFrom;
