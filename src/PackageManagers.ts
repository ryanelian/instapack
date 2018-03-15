import * as cp from 'child_process';
import chalk from 'chalk';
import { platform } from 'process';
import { GlobalSettingsManager } from './GlobalSettingsManager';

export class PackageManager {

    get isWindows() {
        return (platform === 'win32');
    }

    get isOSX() {
        return (platform === 'darwin');
    }

    commandExistCheckerCommand(command: string) {
        if (this.isWindows) {
            return 'where ' + command;
        } else if (this.isOSX) {
            return 'which ' + command
        } else {
            return 'whereis ' + command;
        }
    }

    /**
     * Runs a child process that displays outputs to current command line output.
     * @param command 
     */
    runWithOutputs(command: string) {
        // inherit
        return cp.execSync(command, {
            stdio: [0, 1, 2]
        });
    }

    doesCommandExists(command: string) {
        return new Promise<boolean>((ok, reject) => {
            cp.exec(this.commandExistCheckerCommand(command), (error, stdout, stderr) => {
                if (error) {
                    ok(false);
                    // console.log(error);
                } else {
                    ok(true);
                }
            });
        });
    }

    async restore() {
        let settingsManager = new GlobalSettingsManager();
        let settings = await settingsManager.tryRead();

        if (!settings.packageManager) {
            settings.packageManager = 'yarn';
        }

        if (settings.packageManager === 'yarn') {
            let yarnExists = await this.doesCommandExists('yarn');
            if (!yarnExists) {
                settings.packageManager = 'npm';
            }
        }

        // console.log(settings.packageManager);

        switch (settings.packageManager) {
            case 'yarn': {
                this.runWithOutputs('yarn');
                break;
            }
            case 'npm': {
                this.runWithOutputs('npm install');
                break;
            }
            default: {
                throw new Error('Unknown package manager.');
            }
        }
    }
}
