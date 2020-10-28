"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveFrom = void 0;
const upath = require("upath");
async function resolveFrom(projectFolder, packageName) {
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
exports.resolveFrom = resolveFrom;
