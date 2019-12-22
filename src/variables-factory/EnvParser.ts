import * as fse from 'fs-extra';
import * as upath from 'upath';
import * as DotEnv from 'dotenv';

/**
 * Attempt to parse .env file in the folder.
 */
export async function readDotEnvFrom(folder: string): Promise<MapLikeObject<string>> {
    const file = upath.join(folder, '.env');

    if (await fse.pathExists(file) === false) {
        return {};
    }

    const dotEnvRaw = await fse.readFile(file, 'utf8');
    return DotEnv.parse(dotEnvRaw);
}

export function parseCliEnvFlags(yargsEnv: unknown): MapLikeObject<string> {
    // console.log(yargsEnv);

    const env: MapLikeObject<string> = {};
    if (yargsEnv && typeof yargsEnv === 'object' && Array.isArray(yargsEnv) === false) {
        for (const key in yargsEnv) {
            env[key] = yargsEnv[key].toString();
        }
        // console.log(cliEnv);
    }
    return env;
}
