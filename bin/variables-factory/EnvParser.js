"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCliEnvFlags = exports.readDotEnvFrom = void 0;
const fse = require("fs-extra");
const upath = require("upath");
const DotEnv = require("dotenv");
async function readDotEnvFrom(folder) {
    const file = upath.join(folder, '.env');
    if (await fse.pathExists(file) === false) {
        return {};
    }
    const dotEnvRaw = await fse.readFile(file, 'utf8');
    return DotEnv.parse(dotEnvRaw);
}
exports.readDotEnvFrom = readDotEnvFrom;
function parseCliEnvFlags(yargsEnv) {
    const env = {};
    if (yargsEnv && typeof yargsEnv === 'object' && Array.isArray(yargsEnv) === false) {
        for (const key in yargsEnv) {
            env[key] = yargsEnv[key].toString();
        }
    }
    return env;
}
exports.parseCliEnvFlags = parseCliEnvFlags;
