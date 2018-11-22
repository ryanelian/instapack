"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const chalk_1 = require("chalk");
const packageJSON = require('../package.json');
class Meta {
    get name() {
        return packageJSON.name;
    }
    get version() {
        return packageJSON.version;
    }
    get isOutdated() {
        if (this.remoteVersion) {
            return (this.version < this.remoteVersion);
        }
        return false;
    }
    checkForUpdates() {
        let checker = cp.exec('npm view instapack version', {
            timeout: 5 * 1000
        }, (error, stdout, stderr) => {
            if (error || stderr) {
                return;
            }
            this.remoteVersion = stdout.trim();
        });
    }
    updateNag() {
        if (this.nagOnce) {
            return;
        }
        if (this.isOutdated) {
            console.log();
            console.log(chalk_1.default.yellow('instapack'), 'is outdated. New version:', chalk_1.default.green(this.remoteVersion));
        }
        this.nagOnce = true;
    }
}
exports.Meta = Meta;
