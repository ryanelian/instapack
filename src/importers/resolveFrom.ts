import * as upath from 'upath';

export async function resolveFrom(packageName: string, dir: string): Promise<string | undefined> {
    try {
        const modulePath = upath.toUnix(
            require.resolve(packageName, {
                paths: [dir]
            })
        );

        if (modulePath.startsWith(dir) === false) {
            // prevent resolution outside dir
            return undefined;
        }

        return modulePath;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}
