"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPackageVersion = void 0;
const fse = require("fs-extra");
const upath = require("upath");
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
exports.readPackageVersion = readPackageVersion;
