"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const upath = require("upath");
const Shout_1 = require("./Shout");
const chalk = require("chalk");
function convertTypeScriptPathToWebpackAliasPath(rootPath, baseUrl, value) {
    if (upath.isAbsolute(baseUrl) === false) {
        baseUrl = upath.join(rootPath, baseUrl);
    }
    let result = upath.join(baseUrl, value);
    if (result.endsWith('/*')) {
        result = result.substr(0, result.length - 2);
    }
    return result;
}
function convertMapSetOfStringToArray(arg) {
    const result = {};
    for (const key in arg) {
        const value = Array.from(arg[key]);
        if (value.length) {
            result[key] = value;
        }
    }
    return result;
}
function mergeTypeScriptPathAlias(compilerOptions, rootPath, alias) {
    const result = {};
    for (const key in alias) {
        const value = alias[key];
        result[key] = new Set([value]);
    }
    if (compilerOptions.paths === undefined) {
        return convertMapSetOfStringToArray(result);
    }
    if (compilerOptions.baseUrl === undefined) {
        Shout_1.Shout.warning(chalk.cyan('tsconfig.json'), 'paths are defined, but baseUrl is not!', chalk.grey('(Ignoring paths)'));
        return convertMapSetOfStringToArray(result);
    }
    for (const key in compilerOptions.paths) {
        if (key === '*') {
            continue;
        }
        let compatKey = key + '$';
        if (key.endsWith('/*')) {
            compatKey = key.substr(0, key.length - 2);
        }
        if (result[compatKey] === undefined) {
            result[compatKey] = new Set();
        }
        for (const value of compilerOptions.paths[key]) {
            const compatValue = convertTypeScriptPathToWebpackAliasPath(rootPath, compilerOptions.baseUrl, value);
            result[compatKey].add(compatValue);
        }
    }
    return convertMapSetOfStringToArray(result);
}
exports.mergeTypeScriptPathAlias = mergeTypeScriptPathAlias;
function getWildcardModules(compilerOptions, rootPath) {
    if (compilerOptions.baseUrl === undefined) {
        return undefined;
    }
    const r = new Set();
    const p = compilerOptions.paths;
    if (p && p['*']) {
        for (const value of p['*']) {
            const result = convertTypeScriptPathToWebpackAliasPath(rootPath, compilerOptions.baseUrl, value);
            r.add(result);
        }
    }
    else {
        r.add(compilerOptions.baseUrl);
    }
    r.add('node_modules');
    return Array.from(r);
}
exports.getWildcardModules = getWildcardModules;
