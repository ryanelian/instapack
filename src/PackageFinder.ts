import * as upath from 'upath';

export async function tryGetProjectModulePath(projectFolder: string, packageName: string): Promise<string | undefined> {
    try {
        let modulePath = require.resolve(packageName, {
            paths: [projectFolder]
        });

        modulePath = upath.toUnix(modulePath);
        if (modulePath.startsWith(projectFolder) === false) {
            // explicitly prevent resolution in parent folder...
            return undefined;
        }

        return modulePath;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}

export async function tryGetProjectModule<T>(projectFolder: string, packageName: string): Promise<T | undefined> {
    try {
        const path = await tryGetProjectModulePath(projectFolder, packageName);
        if (!path) {
            return undefined;
        }
        const module = await import(path);
        return module;
    } catch (error) {
        return undefined;
    }
}

import type { ESLint } from 'eslint';
type ESLintModuleType = typeof import('eslint');

interface ProjectESLint {
    linter: ESLint;
    version: string;
}

export async function tryGetProjectESLint(projectBasePath: string, indexTsPath: string): Promise<ProjectESLint | undefined> {
    try {
        const eslintModule = await tryGetProjectModule<ESLintModuleType>(projectBasePath, 'eslint');
        if (!eslintModule) {
            return undefined;
        }

        const ESLint = eslintModule.ESLint;
        const linter = new ESLint({
            cwd: projectBasePath
        });

        // const config =
        await linter.calculateConfigForFile(indexTsPath);
        // console.log(config);

        return {
            linter: linter,
            version: ESLint.version
        };
    } catch (error) {
        // console.log(error);
        return undefined;
    }
}
