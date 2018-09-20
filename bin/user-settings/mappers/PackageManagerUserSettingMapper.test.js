"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const PackageManagerUserSettingMapper_1 = require("./PackageManagerUserSettingMapper");
let pmMapper = new PackageManagerUserSettingMapper_1.PackageManagerUserSettingMapper();
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
