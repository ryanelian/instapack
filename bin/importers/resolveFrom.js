"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveFrom = void 0;
const upath = require("upath");
async function resolveFrom(packageName, dir) {
    try {
        const modulePath = upath.toUnix(require.resolve(packageName, {
            paths: [dir]
        }));
        if (modulePath.startsWith(dir) === false) {
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
