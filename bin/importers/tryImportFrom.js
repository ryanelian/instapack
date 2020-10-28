"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryImportFrom = void 0;
const resolveFrom_1 = require("./resolveFrom");
async function tryImportFrom(projectFolder, packageName) {
    try {
        const path = await resolveFrom_1.resolveFrom(projectFolder, packageName);
        if (!path) {
            return undefined;
        }
        return require(path);
    }
    catch (error) {
        return undefined;
    }
}
exports.tryImportFrom = tryImportFrom;
