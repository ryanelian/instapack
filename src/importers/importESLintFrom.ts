import { tryImportFrom } from './tryImportFrom';
import type { ESLint } from 'eslint';
type ESLintModuleType = typeof import('eslint');

export interface ProjectESLint {
    linter: ESLint;
    version: string;
}

export async function importESLintFrom(dir: string, indexTsPath: string): Promise<ProjectESLint | undefined> {
    try {
        const eslintModule = tryImportFrom<ESLintModuleType>('eslint', dir);
        if (!eslintModule) {
            return undefined;
        }

        const ESLint = eslintModule.ESLint;
        const linter = new ESLint({
            cwd: dir
        });

        // const config =
        await linter.calculateConfigForFile(indexTsPath);
        // console.log(config);
        return {
            linter: linter,
            version: ESLint.version
        };
    } catch (err) {
        if (err instanceof Error) {
            console.log(err.message);
        }
        return undefined;
    }
}
