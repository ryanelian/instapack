"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const https = require("https");
const chalk_1 = require("chalk");
const packageJSON = require('../package.json');
const remotePackageJsonUrl = 'https://raw.githubusercontent.com/ryanelian/instapack/master/package.json';
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
        this.updateChecker = https.get(remotePackageJsonUrl, response => {
            let body = '';
            response.setEncoding('utf8');
            response.on('data', data => {
                body += data;
            });
            response.on('end', () => {
                try {
                    let json = JSON.parse(body);
                    this.remoteVersion = json.version;
                }
                catch (error) {
                }
            });
        }).on('error', () => { });
    }
    updateNag() {
        if (this.nagOnce) {
            return;
        }
        if (this.updateChecker) {
            this.updateChecker.abort();
        }
        if (this.isOutdated) {
            console.log();
            console.log(chalk_1.default.yellow('instapack'), 'is outdated. New version:', chalk_1.default.green(this.remoteVersion));
            if (parseInt(process.versions.node[0]) < 8) {
                console.log(chalk_1.default.red('BEFORE UPDATING:'), chalk_1.default.yellow('install the latest Node.js LTS version 8'), 'for better build performance!');
                console.log('Download URL: ' + chalk_1.default.blue('https://nodejs.org/en/download/'));
            }
        }
        this.nagOnce = true;
    }
}
exports.Meta = Meta;
