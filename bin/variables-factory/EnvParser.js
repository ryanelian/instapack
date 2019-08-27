"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fse = require("fs-extra");
const upath = require("upath");
const DotEnv = require("dotenv");
function readDotEnvFrom(folder) {
    return __awaiter(this, void 0, void 0, function* () {
        let file = upath.join(folder, '.env');
        if ((yield fse.pathExists(file)) === false) {
            return {};
        }
        ;
        let dotEnvRaw = yield fse.readFile(file, 'utf8');
        return DotEnv.parse(dotEnvRaw);
    });
}
exports.readDotEnvFrom = readDotEnvFrom;
function parseCliEnvFlags(yargsEnv) {
    let env = {};
    if (yargsEnv && typeof yargsEnv === 'object' && Array.isArray(yargsEnv) === false) {
        for (let key in yargsEnv) {
            env[key] = yargsEnv[key].toString();
        }
    }
    return env;
}
exports.parseCliEnvFlags = parseCliEnvFlags;
