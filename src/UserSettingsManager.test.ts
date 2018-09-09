import test from 'ava';
import { UserSettingsManager, NotificationUserSettingMapper, PackageManagerUserSettingMapper } from "./UserSettingsManager";
import { IUserSettings } from "./interfaces/IUserSettings";
import upath from 'upath';

let man = new UserSettingsManager();
let notifMapper = new NotificationUserSettingMapper();
let pmMapper = new PackageManagerUserSettingMapper();

let defaultSettings: IUserSettings = {
    muteNotification: false,
    packageManager: 'yarn'
};

test('User Setting Mapper - Package Manager: Key', t => {
    let a = pmMapper.key in defaultSettings;
    t.is(a, true);
});

test('User Setting Mapper - Package Manager: Transformer NPM', t => {
    let a = pmMapper.valueTransformer('NPM');
    t.is(a, 'npm');
});

test('User Setting Mapper - Package Manager: Validate yarn', t => {
    let a = pmMapper.valueValidator('yarn');
    t.is(a, true);
});

test('User Setting Mapper - Package Manager: Validate NPM', t => {
    let a = pmMapper.valueValidator('NPM');
    t.is(a, true);
});

test('User Setting Mapper - Package Manager: Validate DISABLED', t => {
    let a = pmMapper.valueValidator('DISABLED');
    t.is(a, true);
});

test('User Setting Mapper - Package Manager: Validate asdf', t => {
    let a = pmMapper.valueValidator('asdf');
    t.is(a, false);
});

test('User Setting Mapper - Notification: Key', t => {
    let a = notifMapper.key in defaultSettings;
    t.is(a, true);
});

test('User Setting Mapper - Notification: Transformer TRUE', t => {
    let a = notifMapper.valueTransformer('TRUE');
    t.is(a, true);
});

test('User Setting Mapper - Notification: Transformer false', t => {
    let a = notifMapper.valueTransformer('false');
    t.is(a, false);
});

test('User Setting Mapper - Notification: Validate TRUE', t => {
    let a = notifMapper.valueValidator('TRUE');
    t.is(a, true);
});

test('User Setting Mapper - Notification: Validate false', t => {
    let a = notifMapper.valueValidator('false');
    t.is(a, true);
});

test('User Setting Mapper - Notification: Validate asdf', t => {
    let a = notifMapper.valueValidator('asdf');
    t.is(a, false);
});

test('User Settings Manager: Available Settings', t => {
    t.deepEqual(man.availableSettings, ['package-manager', 'mute-notification']);
});

test('User Settings Manager: Validate Package Manager NPM', t => {
    let valid = man.validate('package-manager', 'NPM');
    t.is(valid, true);
});

test('User Settings Manager: Validate Package Manager yarn', t => {
    let valid = man.validate('package-manager', 'yarn');
    t.is(valid, true);
});

test('User Settings Manager: Validate Package Manager DISABLED', t => {
    let valid = man.validate('package-manager', 'DISABLED');
    t.is(valid, true);
});

test('User Settings Manager: Validate Package Manager asdf', t => {
    let valid = man.validate('package-manager', 'asdf');
    t.is(valid, false);
});

test('User Settings Manager: Validate Mute Notification TRUE', t => {
    let valid = man.validate('mute-notification', 'TRUE');
    t.is(valid, true);
});

test('User Settings Manager: Validate Mute Notification false', t => {
    let valid = man.validate('mute-notification', 'false');
    t.is(valid, true);
});

test('User Settings Manager: Validate Mute Notification asdf', t => {
    let valid = man.validate('mute-notification', 'asdf');
    t.is(valid, false);
});

test('User Settings Manager: Validate asdf', t => {
    let valid = man.validate('asdf', 'jkl');
    t.is(valid, false);
});

let root = process.cwd();
let fixtures = upath.join(root, 'fixtures');

test('User Settings Manager: Read Not Found', async t => {
    let file = upath.join(fixtures, 'UserSettingsNotFound', 'settings.json');
    let settings = await man.readUserSettingsFrom(file);
    t.deepEqual(settings, defaultSettings);
});

test('User Settings Manager: Read Invalid', async t => {
    let file = upath.join(fixtures, 'UserSettingsInvalid', 'settings.json');
    let settings = await man.readUserSettingsFrom(file);
    t.deepEqual(settings, defaultSettings);
});

test('User Settings Manager: Read Valid', async t => {
    let file = upath.join(fixtures, 'UserSettingsValid', 'settings.json');
    let settings = await man.readUserSettingsFrom(file);
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

    man.set(settings, 'mute-notification', 'TRUE');
    man.set(settings, 'package-manager', 'NPM');

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
        man.set(settings, key, 'jkl');
    });
});
