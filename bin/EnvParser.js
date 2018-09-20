"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const upath_1 = __importDefault(require("upath"));
const dotenv_1 = __importDefault(require("dotenv"));
function readDotEnvFrom(folder) {
    return __awaiter(this, void 0, void 0, function* () {
        let file = upath_1.default.join(folder, '.env');
        if ((yield fs_extra_1.default.pathExists(file)) === false) {
            return {};
        }
        ;
        let dotEnvRaw = yield fs_extra_1.default.readFile(file, 'utf8');
        return dotenv_1.default.parse(dotEnvRaw);
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
