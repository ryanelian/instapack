"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
