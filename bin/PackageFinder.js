"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryGetProjectESLint = exports.tryGetProjectModule = exports.tryGetProjectModulePath = void 0;
const upath = require("upath");
async function tryGetProjectModulePath(projectFolder, packageName) {
    try {
        let modulePath = require.resolve(packageName, {
            paths: [projectFolder]
        });
        modulePath = upath.toUnix(modulePath);
        if (modulePath.startsWith(projectFolder) === false) {
            return undefined;
        }
        return modulePath;
    }
    catch (error) {
        console.log(error);
        return undefined;
    }
}
exports.tryGetProjectModulePath = tryGetProjectModulePath;
async function tryGetProjectModule(projectFolder, packageName) {
    try {
        const path = await tryGetProjectModulePath(projectFolder, packageName);
        if (!path) {
            return undefined;
        }
        return require(path);
    }
    catch (error) {
        return undefined;
    }
}
exports.tryGetProjectModule = tryGetProjectModule;
async function tryGetProjectESLint(projectBasePath, indexTsPath) {
    try {
        const eslintModule = await tryGetProjectModule(projectBasePath, 'eslint');
        if (!eslintModule) {
            return undefined;
        }
        const ESLint = eslintModule.ESLint;
        const linter = new ESLint({
            cwd: projectBasePath
        });
        await linter.calculateConfigForFile(indexTsPath);
        return {
            linter: linter,
            version: ESLint.version
        };
    }
    catch (error) {
        return undefined;
    }
}
exports.tryGetProjectESLint = tryGetProjectESLint;
