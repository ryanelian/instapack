import test from "ava";
import { PackageManagerUserSettingMapper } from "./PackageManagerUserSettingMapper";
import { IUserSettings } from "../IUserSettings";

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
