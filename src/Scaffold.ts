import * as fse from 'fs-extra';
import * as path from 'path';
import * as cp from 'child_process';
import chalk from 'chalk';

/**
 * Contains methods for initializing new project.
 */
export class Scaffold {
    /**
     * Runs a child process that displays outputs to current command line output.
     * @param command 
     */
    exec(command: string) {
        // inherit
        return cp.execSync(command, {
            stdio: [0, 1, 2]
        });
    }

    /**
     * Attempts to restore packages using Yarn. If failed, attempts to restore package using NPM.
     */
    restorePackages() {
        console.log();

        try {
            this.exec('yarn');
        }
        catch (error) {
            console.log();
            console.log(chalk.red('Package restore using Yarn failed.') + ' Attempting package restore using NPM...');
            console.log();
            this.exec('npm install');
            // if NPM fails, tough luck.
        }

        console.log();
    }

    /**
     * Initialize project using an officially shipped template.
     * @param name 
     */
    async usingTemplate(name) {
        let templateFolder = path.join(__dirname, '../templates', name);
        let thisFolder = process.cwd();

        let exist = await fse.pathExists(templateFolder);
        if (!exist) {
            console.error(chalk.red('ERROR') + ' Unable to find new project template for: ' + chalk.cyan(name));
            return;
        }

        console.log('Initializing new project using template: ' + chalk.cyan(name));
        console.log('Scaffolding project into your web app...');
        await fse.copy(templateFolder, thisFolder);
        console.log(chalk.green('Scaffold completed.') + ' Restoring packages for you...');

        this.restorePackages();

        console.log(chalk.green('Package restored successfully!'));
        console.log('To build the app, type: ' + chalk.yellow('ipack'));
    }
}
