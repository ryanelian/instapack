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
const ava_1 = require("ava");
const upath = require("upath");
const UserSettingsManager_1 = require("./UserSettingsManager");
let defaultSettings = {
    muteNotification: false,
    packageManager: 'yarn'
};
ava_1.default('User Settings Manager: Validate Package Manager NPM', t => {
    let valid = UserSettingsManager_1.validateUserSetting('package-manager', 'NPM');
    t.is(valid, true);
});
ava_1.default('User Settings Manager: Validate Package Manager yarn', t => {
    let valid = UserSettingsManager_1.validateUserSetting('package-manager', 'yarn');
    t.is(valid, true);
});
ava_1.default('User Settings Manager: Validate Package Manager DISABLED', t => {
    let valid = UserSettingsManager_1.validateUserSetting('package-manager', 'DISABLED');
    t.is(valid, true);
});
ava_1.default('User Settings Manager: Validate Package Manager asdf', t => {
    let valid = UserSettingsManager_1.validateUserSetting('package-manager', 'asdf');
    t.is(valid, false);
});
ava_1.default('User Settings Manager: Validate Mute Notification TRUE', t => {
    let valid = UserSettingsManager_1.validateUserSetting('mute-notification', 'TRUE');
    t.is(valid, true);
});
ava_1.default('User Settings Manager: Validate Mute Notification false', t => {
    let valid = UserSettingsManager_1.validateUserSetting('mute-notification', 'false');
    t.is(valid, true);
});
ava_1.default('User Settings Manager: Validate Mute Notification asdf', t => {
    let valid = UserSettingsManager_1.validateUserSetting('mute-notification', 'asdf');
    t.is(valid, false);
});
ava_1.default('User Settings Manager: Validate asdf', t => {
    let valid = UserSettingsManager_1.validateUserSetting('asdf', 'jkl');
    t.is(valid, false);
});
let root = process.cwd();
let fixtures = upath.join(root, 'fixtures');
ava_1.default('User Settings Manager: Read Not Found', (t) => __awaiter(this, void 0, void 0, function* () {
    let file = upath.join(fixtures, 'Empty', 'settings.json');
    let settings = yield UserSettingsManager_1.readUserSettingsFrom(file);
    t.deepEqual(settings, defaultSettings);
}));
ava_1.default('User Settings Manager: Read Invalid', (t) => __awaiter(this, void 0, void 0, function* () {
    let file = upath.join(fixtures, 'UserSettingsInvalid', 'settings.json');
    let settings = yield UserSettingsManager_1.readUserSettingsFrom(file);
    t.deepEqual(settings, defaultSettings);
}));
ava_1.default('User Settings Manager: Read Valid', (t) => __awaiter(this, void 0, void 0, function* () {
    let file = upath.join(fixtures, 'UserSettingsValid', 'settings.json');
    let settings = yield UserSettingsManager_1.readUserSettingsFrom(file);
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
    UserSettingsManager_1.setUserSetting(settings, 'mute-notification', 'TRUE');
    UserSettingsManager_1.setUserSetting(settings, 'package-manager', 'NPM');
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
        UserSettingsManager_1.setUserSetting(settings, key, 'jkl');
    });
});
