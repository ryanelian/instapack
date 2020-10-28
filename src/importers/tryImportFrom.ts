import { resolveFrom } from './resolveFrom';

export async function tryImportFrom<T>(projectFolder: string, packageName: string): Promise<T | undefined> {
    try {
        const path = await resolveFrom(projectFolder, packageName);
        if (!path) {
            return undefined;
        }
        return require(path);
    } catch (error) {
        return undefined;
    }
}
