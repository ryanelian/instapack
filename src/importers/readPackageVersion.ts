import * as fse from 'fs-extra';
import * as upath from 'upath';

export async function readPackageVersion(packageName: string, dir: string): Promise<string | undefined> {
    try {
        const packageJsonPath = upath.toUnix(
            require.resolve(packageName + "/package.json", {
                paths: [dir]
            })
        );

        if (packageJsonPath.startsWith(dir) === false) {
            // prevent resolution outside dir
            return undefined;
        }

        const packageJson = await fse.readJson(packageJsonPath);
        return packageJson.version;
    } catch (err) {
        return undefined;
    }
}
