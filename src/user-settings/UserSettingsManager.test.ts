import test from 'ava';
import * as upath from 'upath';
import { IUserSettings } from './IUserSettings';
import { validateUserSetting, readUserSettingsFrom, setUserSetting } from './UserSettingsManager';

let defaultSettings: IUserSettings = {
    muteNotification: false,
    packageManager: 'yarn'
};

test('User Settings Manager: Validate Package Manager NPM', t => {
    let valid = validateUserSetting('package-manager', 'NPM');
    t.is(valid, true);
});

test('User Settings Manager: Validate Package Manager yarn', t => {
    let valid = validateUserSetting('package-manager', 'yarn');
    t.is(valid, true);
});

test('User Settings Manager: Validate Package Manager DISABLED', t => {
    let valid = validateUserSetting('package-manager', 'DISABLED');
    t.is(valid, true);
});

test('User Settings Manager: Validate Package Manager asdf', t => {
    let valid = validateUserSetting('package-manager', 'asdf');
    t.is(valid, false);
});

test('User Settings Manager: Validate Mute Notification TRUE', t => {
    let valid = validateUserSetting('mute-notification', 'TRUE');
    t.is(valid, true);
});

test('User Settings Manager: Validate Mute Notification false', t => {
    let valid = validateUserSetting('mute-notification', 'false');
    t.is(valid, true);
});

test('User Settings Manager: Validate Mute Notification asdf', t => {
    let valid = validateUserSetting('mute-notification', 'asdf');
    t.is(valid, false);
});

test('User Settings Manager: Validate asdf', t => {
    let valid = validateUserSetting('asdf', 'jkl');
    t.is(valid, false);
});

let root = process.cwd();
let fixtures = upath.join(root, 'fixtures');

test('User Settings Manager: Read Not Found', async t => {
    let file = upath.join(fixtures, 'Empty', 'settings.json');
    let settings = await readUserSettingsFrom(file);
    t.deepEqual(settings, defaultSettings);
});

test('User Settings Manager: Read Invalid', async t => {
    let file = upath.join(fixtures, 'UserSettingsInvalid', 'settings.json');
    let settings = await readUserSettingsFrom(file);
    t.deepEqual(settings, defaultSettings);
});

test('User Settings Manager: Read Valid', async t => {
    let file = upath.join(fixtures, 'UserSettingsValid', 'settings.json');
    let settings = await readUserSettingsFrom(file);
    t.deepEqual(settings, {
        packageManager: 'disabled',
        muteNotification: true
    });
});

test('User Settings Manager: Set', t => {
    let settings: IUserSettings = {
        muteNotification: false,
        packageManager: 'yarn'
    };

    setUserSetting(settings, 'mute-notification', 'TRUE');
    setUserSetting(settings, 'package-manager', 'NPM');

    t.deepEqual(settings, {
        muteNotification: true,
        packageManager: 'npm'
    });
});

test('User Settings Manager: Set Error', t => {
    let settings: IUserSettings = {
        muteNotification: false,
        packageManager: 'yarn'
    };

    let key = 'asdf';

    t.throws(() => {
        setUserSetting(settings, key, 'jkl');
    });
});
