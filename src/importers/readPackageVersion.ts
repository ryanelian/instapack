import * as fse from 'fs-extra';
import * as upath from 'upath';

export async function readPackageVersion(packageName: string, root: string): Promise<string | undefined> {
    try {
        const packageJsonPath = upath.toUnix(
            require.resolve(packageName + "/package.json", {
                paths: [root]
            })
        );

        // do not go out from root folder!
        // console.log(packageJsonPath);
        if (packageJsonPath.startsWith(root) === false) {
            return undefined;
        }

        const packageJson = await fse.readJson(packageJsonPath);
        return packageJson.version;
    } catch (err) {
        return undefined;
    }
}
