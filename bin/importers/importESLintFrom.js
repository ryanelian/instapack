"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importESLintFrom = void 0;
const tryImportFrom_1 = require("./tryImportFrom");
async function importESLintFrom(dir, indexTsPath) {
    try {
        const eslintModule = await tryImportFrom_1.tryImportFrom('eslint', dir);
        if (!eslintModule) {
            return undefined;
        }
        const ESLint = eslintModule.ESLint;
        const linter = new ESLint({
            cwd: dir
        });
        await linter.calculateConfigForFile(indexTsPath);
        return {
            linter: linter,
            version: ESLint.version
        };
    }
    catch (error) {
        console.log(error);
        return undefined;
    }
}
exports.importESLintFrom = importESLintFrom;
