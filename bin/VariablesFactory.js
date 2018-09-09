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
class VariablesFactory {
    compile(buildFlags, projectSettings, userSettings, dotEnv) {
        let variables = {
            root: projectSettings.root,
            input: projectSettings.input,
            output: projectSettings.output,
            jsOut: projectSettings.jsOut,
            cssOut: projectSettings.cssOut,
            alias: projectSettings.alias,
            externals: projectSettings.externals,
            env: Object.assign(dotEnv, buildFlags.env),
            packageManager: userSettings.packageManager,
            muteNotification: userSettings.muteNotification,
            production: buildFlags.production,
            sourceMap: buildFlags.sourceMap,
            watch: buildFlags.watch,
            stats: buildFlags.stats,
            verbose: buildFlags.verbose,
            hot: buildFlags.hot,
            port1: projectSettings.port1,
            port2: projectSettings.port2,
        };
        if (variables.hot) {
            variables.production = false;
            variables.watch = true;
        }
        if (variables.production === false || variables.watch) {
            variables.stats = false;
        }
        return variables;
    }
    isValidExternals(value) {
        if (!value) {
            return false;
        }
        if (typeof value === 'string') {
            return true;
        }
        if (Array.isArray(value)) {
            return value.every(item => typeof item === 'string');
        }
        else if (typeof value === 'object') {
            return true;
        }
        return false;
    }
    readProjectSettingsFrom(folder) {
        return __awaiter(this, void 0, void 0, function* () {
            let settings = {
                root: upath_1.default.toUnix(folder),
                input: 'client',
                output: 'wwwroot',
                jsOut: 'ipack.js',
                cssOut: 'ipack.css',
                alias: {},
                externals: {},
                port1: 0,
                port2: 0
            };
            let parse;
            try {
                let jsonPath = upath_1.default.join(folder, 'package.json');
                let json = yield fs_extra_1.default.readJson(jsonPath);
                parse = json.instapack;
            }
            catch (ex) {
            }
            if (parse) {
                if (typeof parse.input === 'string') {
                    settings.input = parse.input;
                }
                if (typeof parse.output === 'string') {
                    settings.output = parse.output;
                }
                if (typeof parse.jsOut === 'string') {
                    let s = upath_1.default.addExt(parse.jsOut, '.js');
                    settings.jsOut = s;
                }
                if (typeof parse.cssOut === 'string') {
                    let s = upath_1.default.addExt(parse.cssOut, '.css');
                    settings.cssOut = s;
                }
                if (Number.isInteger(parse.port1)) {
                    settings.port1 = parse.port1;
                }
                if (Number.isInteger(parse.port2)) {
                    settings.port2 = parse.port2;
                }
                if (typeof parse.alias === 'object') {
                    for (let key in parse.alias) {
                        let value = parse.alias[key];
                        if (typeof value === 'string') {
                            settings.alias[key] = value;
                        }
                    }
                }
                if (typeof parse.externals === 'object') {
                    for (let key in parse.externals) {
                        let value = parse.externals[key];
                        if (this.isValidExternals(value)) {
                            settings.externals[key] = value;
                        }
                    }
                }
            }
            return settings;
        });
    }
    readDotEnvFrom(folder) {
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
    parseCliEnv(yargsEnv) {
        let env = {};
        if (yargsEnv && typeof yargsEnv === 'object' && Array.isArray(yargsEnv) === false) {
            for (let key in yargsEnv) {
                env[key] = yargsEnv[key].toString();
            }
        }
        return env;
    }
}
exports.VariablesFactory = VariablesFactory;
