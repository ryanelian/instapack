"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importESLintFrom = void 0;
const tryImportFrom_1 = require("./tryImportFrom");
async function importESLintFrom(projectFolder, indexTsPath) {
    try {
        const eslintModule = await tryImportFrom_1.tryImportFrom(projectFolder, 'eslint');
        if (!eslintModule) {
            return undefined;
        }
        const ESLint = eslintModule.ESLint;
        const linter = new ESLint({
            cwd: projectFolder
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
exports.importESLintFrom = importESLintFrom;
