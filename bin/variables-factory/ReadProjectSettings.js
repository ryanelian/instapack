"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fse = require("fs-extra");
const upath = require("upath");
const Ajv = require("ajv");
const settingsJsonSchemaPath = require.resolve('../../schemas/settings.json');
function tryReadPackageJsonInstapackSettings(path) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let packageJson = yield fse.readJson(path);
            let x = packageJson.instapack;
            if (!x) {
                return {};
            }
            return x;
        }
        catch (ex) {
            return {};
        }
    });
}
function readProjectSettingsFrom(folder) {
    return __awaiter(this, void 0, void 0, function* () {
        let settings = {
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
        let settingsJsonSchema = yield fse.readJson(settingsJsonSchemaPath);
        let validate = ajv.compile(settingsJsonSchema);
        let packageJsonPath = upath.join(folder, 'package.json');
        let x = yield tryReadPackageJsonInstapackSettings(packageJsonPath);
        let valid = validate(x);
        if (valid === false) {
            console.error('Abort Build: Invalid instapack project settings in ' + packageJsonPath);
            console.error(validate.errors);
            throw new Error('Invalid instapack project settings!');
        }
        Object.assign(settings, x);
        settings.cssOut = upath.addExt(settings.cssOut, '.css');
        settings.jsOut = upath.addExt(settings.jsOut, '.js');
        return settings;
    });
}
exports.readProjectSettingsFrom = readProjectSettingsFrom;
