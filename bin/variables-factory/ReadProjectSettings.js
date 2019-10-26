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
function isValidExternals(value) {
    if (!value) {
        return false;
    }
    if (typeof value === 'string') {
        return true;
    }
    if (Array.isArray(value)) {
        return value.every(item => typeof item === 'string');
    }
    else if (typeof value === 'object') {
        return true;
    }
    return false;
}
exports.isValidExternals = isValidExternals;
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
            copy: {},
            namespace: undefined,
            port1: 0,
        };
        let parse;
        try {
            let jsonPath = upath.join(folder, 'package.json');
            let json = yield fse.readJson(jsonPath);
            parse = json.instapack;
        }
        catch (ex) {
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
                    if (typeof value === 'string' && value) {
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
            if (typeof parse.copy === 'object') {
                for (let key in parse.copy) {
                    let value = parse.copy[key];
                    if (typeof value === 'string' && value) {
                        settings.copy[key] = value;
                    }
                }
            }
        }
        return settings;
    });
}
exports.readProjectSettingsFrom = readProjectSettingsFrom;
