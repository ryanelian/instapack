import { VuePackageVersions } from '../variables-factory/BuildVariables';
import { readPackageVersion } from './readPackageVersion';

export async function readVuePackageVersionsFrom(folder: string): Promise<VuePackageVersions | undefined> {
    const vue = await readPackageVersion('vue', folder);
    if (!vue) {
        return undefined;
    }

    const versions: VuePackageVersions = {
        vue: vue,
        loader: await readPackageVersion('vue-loader', folder),
        compilerService: undefined
    };

    if (vue.startsWith('2')) {
        versions.compilerService = await readPackageVersion('vue-template-compiler', folder);
    } else if (vue.startsWith('3')) {
        versions.compilerService = await readPackageVersion('@vue/compiler-sfc', folder);
    } else {
        throw new Error(`Unknown Vue version: ${vue}`);
    }
    return versions;
}
