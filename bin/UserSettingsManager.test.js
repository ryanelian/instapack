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
const ava_1 = __importDefault(require("ava"));
const UserSettingsManager_1 = require("./UserSettingsManager");
const upath_1 = __importDefault(require("upath"));
let man = new UserSettingsManager_1.UserSettingsManager();
let notifMapper = new UserSettingsManager_1.NotificationUserSettingMapper();
let pmMapper = new UserSettingsManager_1.PackageManagerUserSettingMapper();
let defaultSettings = {
    muteNotification: false,
    packageManager: 'yarn'
};
ava_1.default('User Setting Mapper - Package Manager: Key', t => {
    let a = pmMapper.key in defaultSettings;
    t.is(a, true);
});
ava_1.default('User Setting Mapper - Package Manager: Transformer NPM', t => {
    let a = pmMapper.valueTransformer('NPM');
    t.is(a, 'npm');
});
ava_1.default('User Setting Mapper - Package Manager: Validate yarn', t => {
    let a = pmMapper.valueValidator('yarn');
    t.is(a, true);
});
ava_1.default('User Setting Mapper - Package Manager: Validate NPM', t => {
    let a = pmMapper.valueValidator('NPM');
    t.is(a, true);
});
ava_1.default('User Setting Mapper - Package Manager: Validate DISABLED', t => {
    let a = pmMapper.valueValidator('DISABLED');
    t.is(a, true);
});
ava_1.default('User Setting Mapper - Package Manager: Validate asdf', t => {
    let a = pmMapper.valueValidator('asdf');
    t.is(a, false);
});
ava_1.default('User Setting Mapper - Notification: Key', t => {
    let a = notifMapper.key in defaultSettings;
    t.is(a, true);
});
ava_1.default('User Setting Mapper - Notification: Transformer TRUE', t => {
    let a = notifMapper.valueTransformer('TRUE');
    t.is(a, true);
});
ava_1.default('User Setting Mapper - Notification: Transformer false', t => {
    let a = notifMapper.valueTransformer('false');
    t.is(a, false);
});
ava_1.default('User Setting Mapper - Notification: Validate TRUE', t => {
    let a = notifMapper.valueValidator('TRUE');
    t.is(a, true);
});
ava_1.default('User Setting Mapper - Notification: Validate false', t => {
    let a = notifMapper.valueValidator('false');
    t.is(a, true);
});
ava_1.default('User Setting Mapper - Notification: Validate asdf', t => {
    let a = notifMapper.valueValidator('asdf');
    t.is(a, false);
});
ava_1.default('User Settings Manager: Available Settings', t => {
    t.deepEqual(man.availableSettings, ['package-manager', 'mute-notification']);
});
ava_1.default('User Settings Manager: Validate Package Manager NPM', t => {
    let valid = man.validate('package-manager', 'NPM');
    t.is(valid, true);
});
ava_1.default('User Settings Manager: Validate Package Manager yarn', t => {
    let valid = man.validate('package-manager', 'yarn');
    t.is(valid, true);
});
ava_1.default('User Settings Manager: Validate Package Manager DISABLED', t => {
    let valid = man.validate('package-manager', 'DISABLED');
    t.is(valid, true);
});
ava_1.default('User Settings Manager: Validate Package Manager asdf', t => {
    let valid = man.validate('package-manager', 'asdf');
    t.is(valid, false);
});
ava_1.default('User Settings Manager: Validate Mute Notification TRUE', t => {
    let valid = man.validate('mute-notification', 'TRUE');
    t.is(valid, true);
});
ava_1.default('User Settings Manager: Validate Mute Notification false', t => {
    let valid = man.validate('mute-notification', 'false');
    t.is(valid, true);
});
ava_1.default('User Settings Manager: Validate Mute Notification asdf', t => {
    let valid = man.validate('mute-notification', 'asdf');
    t.is(valid, false);
});
ava_1.default('User Settings Manager: Validate asdf', t => {
    let valid = man.validate('asdf', 'jkl');
    t.is(valid, false);
});
let root = process.cwd();
let fixtures = upath_1.default.join(root, 'fixtures');
ava_1.default('User Settings Manager: Read Not Found', (t) => __awaiter(this, void 0, void 0, function* () {
    let file = upath_1.default.join(fixtures, 'Empty', 'settings.json');
    let settings = yield man.readUserSettingsFrom(file);
    t.deepEqual(settings, defaultSettings);
}));
ava_1.default('User Settings Manager: Read Invalid', (t) => __awaiter(this, void 0, void 0, function* () {
    let file = upath_1.default.join(fixtures, 'UserSettingsInvalid', 'settings.json');
    let settings = yield man.readUserSettingsFrom(file);
    t.deepEqual(settings, defaultSettings);
}));
ava_1.default('User Settings Manager: Read Valid', (t) => __awaiter(this, void 0, void 0, function* () {
    let file = upath_1.default.join(fixtures, 'UserSettingsValid', 'settings.json');
    let settings = yield man.readUserSettingsFrom(file);
    t.deepEqual(settings, {
        packageManager: 'disabled',
        muteNotification: true
    });
}));
ava_1.default('User Settings Manager: Set', t => {
    let settings = {
        muteNotification: false,
        packageManager: 'yarn'
    };
    man.set(settings, 'mute-notification', 'TRUE');
    man.set(settings, 'package-manager', 'NPM');
    t.deepEqual(settings, {
        muteNotification: true,
        packageManager: 'npm'
    });
});
ava_1.default('User Settings Manager: Set Error', t => {
    let settings = {
        muteNotification: false,
        packageManager: 'yarn'
    };
    let key = 'asdf';
    t.throws(() => {
        man.set(settings, key, 'jkl');
    });
});
