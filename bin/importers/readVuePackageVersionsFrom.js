"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readVuePackageVersionsFrom = void 0;
const readPackageVersion_1 = require("./readPackageVersion");
async function readVuePackageVersionsFrom(folder) {
    const vue = await readPackageVersion_1.readPackageVersion('vue', folder);
    if (!vue) {
        return undefined;
    }
    const versions = {
        vue: vue,
        loader: await readPackageVersion_1.readPackageVersion('vue-loader', folder),
        compilerService: undefined
    };
    if (vue.startsWith('2')) {
        versions.compilerService = await readPackageVersion_1.readPackageVersion('vue-template-compiler', folder);
    }
    else if (vue.startsWith('3')) {
        versions.compilerService = await readPackageVersion_1.readPackageVersion('@vue/compiler-sfc', folder);
    }
    else {
        throw new Error(`Unknown Vue version: ${vue}`);
    }
    return versions;
}
exports.readVuePackageVersionsFrom = readVuePackageVersionsFrom;
