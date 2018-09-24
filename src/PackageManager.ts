import * as Process from 'process';
import * as ChildProcess from 'child_process';

/**
 * Contains methods responsible for restoring user packages.
 */
export class PackageManager {
    /**
     * Detects if instapack is running on Windows OS.
     */
    get isWindows() {
        return (Process.platform === 'win32');
    }

    /**
     * Detects if instapack is running on Mac OS.
     */
    get isMac() {
        return (Process.platform === 'darwin');
    }

    /**
     * Returns OS-suitable command for detecting whether another CLI tool is available on the system. 
     * @param tool 
     */
    toolExistCheckerCommand(tool: string) {
        if (this.isWindows) {
            return 'where ' + tool;
        } else if (this.isMac) {
            return 'which ' + tool
        } else {
            return 'whereis ' + tool;
        }
    }

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

    /**
     * Asynchronously checks whether a CLI tool exists in the system.
     * @param tool 
     */
    doesToolExists(tool: string) {
        return new Promise<boolean>((ok, reject) => {
            ChildProcess.exec(this.toolExistCheckerCommand(tool), (error, stdout, stderr) => {
                if (error) {
                    ok(false);
                    // console.log(error);
                } else {
                    ok(true);
                }
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
    async restore(packageManager) {
        if (!packageManager) {
            packageManager = 'yarn';
        }

        if (packageManager === 'yarn') {
            let yarnExists = await this.doesToolExists('yarn');
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
