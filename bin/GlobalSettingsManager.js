"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const upath = require("upath");
const os = require("os");
const fse = require("fs-extra");
const chalk_1 = require("chalk");
class GlobalSettingsManager {
    constructor() {
        this.keyMapper = {
            'package-manager': 'packageManager'
        };
    }
    get globalConfigurationJsonPath() {
        return upath.join(os.homedir(), 'instapack', 'settings.json');
    }
    validate(key, value) {
        if (!this.keyMapper[key]) {
            return false;
        }
        switch (key) {
            case 'package-manager': {
                if (value !== 'yarn' && value !== 'npm') {
                    return false;
                }
                break;
            }
            default: {
                break;
            }
        }
        return true;
    }
    tryRead() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield fse.readJson(this.globalConfigurationJsonPath);
            }
            catch (_a) {
                return {
                    packageManager: 'yarn'
                };
            }
        });
    }
    set(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = this.globalConfigurationJsonPath;
            console.log('Using global configuration file:', chalk_1.default.cyan(file));
            let settings = yield this.tryRead();
            let realKey = this.keyMapper[key];
            settings[realKey] = value;
            try {
                yield fse.ensureFile(file);
                yield fse.writeJson(file, settings);
                console.log('Successfully saved new configuration!');
            }
            catch (error) {
                console.error('Error when saving file:');
                console.error(error);
            }
        });
    }
}
exports.GlobalSettingsManager = GlobalSettingsManager;
