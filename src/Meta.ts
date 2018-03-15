import * as https from 'https';
import { ClientRequest } from 'http';
import chalk from 'chalk';

const packageJSON = require('../package.json');
const remotePackageJsonUrl = 'https://raw.githubusercontent.com/ryanelian/instapack/master/package.json';

export class Meta {

    updateChecker: ClientRequest;
    remoteVersion: string;
    nagOnce: boolean;

    get name(): string {
        return packageJSON.name;
    }

    get version(): string {
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
                } catch (error) {
                }
            });

        }).on('error', () => { });
    }

    updateNag() {
        if (this.nagOnce) {
            return;
        }

        this.updateChecker.abort();

        if (this.isOutdated) {
            console.log();
            console.log(chalk.yellow('instapack') + ' is outdated. New version: ' + chalk.green(this.remoteVersion));
            if (parseInt(process.versions.node[0]) < 8) {
                console.log(chalk.red('BEFORE UPDATING: ') + chalk.yellow('install the latest Node.js LTS version 8 ') + 'for better build performance!');
                console.log('Download URL: ' + chalk.blue('https://nodejs.org/en/download/'));
            }
        }

        // Prevent displaying message more than once... (Happens during SIGINT)
        this.nagOnce = true;
    }

}