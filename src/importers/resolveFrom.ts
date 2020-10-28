import * as upath from 'upath';

export async function resolveFrom(projectFolder: string, packageName: string): Promise<string | undefined> {
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
