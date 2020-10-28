import { resolveFrom } from './resolveFrom';

export async function tryImportFrom<T>(packageName: string, dir: string): Promise<T | undefined> {
    try {
        const path = await resolveFrom(packageName, dir);
        if (!path) {
            return undefined;
        }
        return require(path);
    } catch (error) {
        return undefined;
    }
}
