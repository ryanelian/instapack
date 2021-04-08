import { resolveFrom } from './resolveFrom';

export function tryImportFrom<T>(packageName: string, dir: string): T | undefined {
    try {
        const path = resolveFrom(packageName, dir);
        if (!path) {
            return undefined;
        }
        return require(path);
    } catch (error) {
        return undefined;
    }
}
