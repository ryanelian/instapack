"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const NotificationUserSettingMapper_1 = require("./NotificationUserSettingMapper");
let notifMapper = new NotificationUserSettingMapper_1.NotificationUserSettingMapper();
let defaultSettings = {
    muteNotification: false,
    packageManager: 'yarn'
};
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
