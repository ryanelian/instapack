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
const upath_1 = __importDefault(require("upath"));
const os_1 = __importDefault(require("os"));
const fs_extra_1 = __importDefault(require("fs-extra"));
class PackageManagerUserSettingMapper {
    constructor() {
        this.key = 'packageManager';
        this.valueTransformer = (value) => value.toLowerCase();
        this.valueValidator = (value) => {
            value = value.toLowerCase();
            return (value === 'yarn' || value === 'npm' || value === 'disabled');
        };
    }
}
exports.PackageManagerUserSettingMapper = PackageManagerUserSettingMapper;
class NotificationUserSettingMapper {
    constructor() {
        this.key = 'muteNotification';
        this.valueTransformer = (value) => {
            return (value.toLowerCase() === 'true');
        };
        this.valueValidator = (value) => {
            value = value.toLowerCase();
            return (value === 'true' || value === 'false');
        };
    }
}
exports.NotificationUserSettingMapper = NotificationUserSettingMapper;
class UserSettingsManager {
    constructor() {
        this.settingMappers = {
            'package-manager': new PackageManagerUserSettingMapper(),
            'mute-notification': new NotificationUserSettingMapper()
        };
    }
    get userSettingsFilePath() {
        return upath_1.default.join(os_1.default.homedir(), 'instapack', 'settings.json');
    }
    get availableSettings() {
        return Object.keys(this.settingMappers);
    }
    validate(key, value) {
        if (!this.settingMappers[key]) {
            return false;
        }
        return this.settingMappers[key].valueValidator(value);
    }
    readUserSettingsFrom(file) {
        return __awaiter(this, void 0, void 0, function* () {
            let settings = {
                muteNotification: false,
                packageManager: 'yarn'
            };
            try {
                let json = yield fs_extra_1.default.readJson(file);
                if (json.packageManager === 'yarn' || json.packageManager === 'npm' || json.packageManager === 'disabled') {
                    settings.packageManager = json.packageManager;
                }
                if (typeof json.muteNotification === 'boolean') {
                    settings.muteNotification = json.muteNotification;
                }
            }
            catch (_a) {
            }
            return settings;
        });
    }
    set(settings, key, value) {
        let mapper = this.settingMappers[key];
        if (!mapper) {
            throw new Error('Mapper not registered for provided key: ' + key);
        }
        let realKey = mapper.key;
        let realValue = mapper.valueTransformer(value);
        settings[realKey] = realValue;
    }
}
exports.UserSettingsManager = UserSettingsManager;
