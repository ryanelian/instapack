import * as upath from 'upath';

export function resolveFrom(packageName: string, dir: string): string | undefined {
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
