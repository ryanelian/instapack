import * as Process from 'process';
import * as ChildProcess from 'child_process';
import which = require('which');

/**
 * Contains methods responsible for restoring user packages.
 */
export class PackageManager {
    /**
     * Runs a child process that displays outputs to current command line output.
     * @param command 
     */
    runWithOutputs(command: string) {
        // inherit
        return ChildProcess.execSync(command, {
            stdio: [0, 1, 2]
        });
    }

    async whichAsync(tool: string) {
        return new Promise<string>((ok, reject) => {
            which(tool, (err, path) => {
                if (err) {
                    reject(err);
                    return;
                }

                ok(path);
            });
        });
    }

    /**
     * Asynchronously attempts to restore project packages using selected tool.
     * If the tool is not defined, defaults to yarn.
     * If yarn is not found in the system, fallback to npm.
     * Throws if the tool is unknown.
     * @param packageManager 
     */
    async restore(packageManager: string) {
        if (!packageManager) {
            packageManager = 'yarn';
        }

        if (packageManager === 'yarn') {
            let yarnExists = await this.whichAsync('yarn');
            if (!yarnExists) {
                packageManager = 'npm';
            }
        }

        // console.log(settings.packageManager);

        switch (packageManager) {
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
