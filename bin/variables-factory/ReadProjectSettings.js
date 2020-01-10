"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fse = require("fs-extra");
const upath = require("upath");
const Ajv = require("ajv");
const Shout_1 = require("../Shout");
const settingsJsonSchemaPath = require.resolve('../../schemas/settings.json');
async function tryReadPackageJsonInstapackSettings(path) {
    try {
        const packageJson = await fse.readJson(path);
        const x = packageJson.instapack;
        if (!x) {
            return {};
        }
        return x;
    }
    catch (ex) {
        return {};
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
        port1: 0
    };
    const ajv = new Ajv();
    const settingsJsonSchema = await fse.readJson(settingsJsonSchemaPath);
    const validate = ajv.compile(settingsJsonSchema);
    const packageJsonPath = upath.join(folder, 'package.json');
    const x = await tryReadPackageJsonInstapackSettings(packageJsonPath);
    const valid = validate(x);
    if (valid === false) {
        Shout_1.Shout.fatal('Abort Build: Invalid instapack project settings in ' + packageJsonPath);
        console.error(validate.errors);
        throw new Error('Invalid instapack project settings!');
    }
    Object.assign(settings, x);
    settings.cssOut = upath.addExt(settings.cssOut, '.css');
    settings.jsOut = upath.addExt(settings.jsOut, '.js');
    return settings;
}
exports.readProjectSettingsFrom = readProjectSettingsFrom;
