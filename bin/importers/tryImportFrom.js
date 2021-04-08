"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryImportFrom = void 0;
const resolveFrom_1 = require("./resolveFrom");
function tryImportFrom(packageName, dir) {
    try {
        const path = resolveFrom_1.resolveFrom(packageName, dir);
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
