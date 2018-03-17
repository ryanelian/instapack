import * as https from 'https';
import { ClientRequest } from 'http';
import chalk from 'chalk';

const packageJSON = require('../package.json');
const remotePackageJsonUrl = 'https://raw.githubusercontent.com/ryanelian/instapack/master/package.json';

/**
 * Contains properties and methods
 */
export class Meta {
    /**
     * Sets or gets the HTTP request for checking remote instapack version.
     */
    private updateChecker: ClientRequest;

    /**
     * Sets or gets the nag display flag. User should not be nagged twice.
     */
    private nagOnce: boolean;

    /**
     * Sets or gets the remote instapack version.
     */
    remoteVersion: string;

    /**
     * Gets the instapack npm package name.
     */
    get name(): string {
        return packageJSON.name;
    }

    /**
     * Gets the current instapack version. 
     */
    get version(): string {
        return packageJSON.version;
    }

    /**
     * Gets an evaluation whether the current instapack version is outdated.
     */
    get isOutdated() {
        if (this.remoteVersion) {
            return (this.version < this.remoteVersion);
        }

        return false;
    }

    /**
     * Triggers a background HTTP request to instapack GitHub master branch, checking remote package version.
     */
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

    /**
     * Displays an update message to user if instapack is outdated, once.
     */
    updateNag() {
        if (this.nagOnce) {
            return;
        }

        if (this.updateChecker) {
            this.updateChecker.abort();
        }

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