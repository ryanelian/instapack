import fse from 'fs-extra';
import upath from 'upath';
import dotenv from 'dotenv';

import { IMapLike } from './interfaces/IMapLike';

/**
 * Attempt to parse .env file in the folder.
 */
export async function readDotEnvFrom(folder: string): Promise<IMapLike<string>> {
    let file = upath.join(folder, '.env');

    if (await fse.pathExists(file) === false) {
        return {};
    };

    let dotEnvRaw = await fse.readFile(file, 'utf8');
    return dotenv.parse(dotEnvRaw);
}

export function parseCliEnvFlags(yargsEnv: any): any {
    // console.log(yargsEnv);

    let env: IMapLike<string> = {};
    if (yargsEnv && typeof yargsEnv === 'object' && Array.isArray(yargsEnv) === false) {
        for (let key in yargsEnv) {
            env[key] = yargsEnv[key].toString();
        }
        // console.log(cliEnv);
    }
    return env;
}
