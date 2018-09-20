"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
