import test from "ava";
import { NotificationUserSettingMapper } from "./NotificationUserSettingMapper";
import { IUserSettings } from "../IUserSettings";

let notifMapper = new NotificationUserSettingMapper();

let defaultSettings: IUserSettings = {
    muteNotification: false,
    packageManager: 'yarn'
};

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