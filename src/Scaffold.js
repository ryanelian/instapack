"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fse = require("fs-extra");
const path = require("path");
const cp = require("child_process");
const chalk = require("chalk");
class Scaffold {
    exec(command) {
        return cp.execSync(command, {
            stdio: [0, 1, 2]
        });
    }
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
        }
        console.log();
    }
    usingTemplate(name) {
        let templateFolder = path.join(__dirname, '../templates', name);
        let thisFolder = process.cwd();
        let exist = fse.existsSync(templateFolder);
        if (!exist) {
            console.log('Unable to find new project template for: ' + chalk.red(name));
            return;
        }
        console.log('Initializing new project using template: ' + chalk.cyan(name));
        console.log('Scaffolding project into your web application...');
        fse.copySync(templateFolder, thisFolder);
        console.log(chalk.green('Scaffold completed.') + ' Restoring packages for you...');
        this.restorePackages();
        console.log(chalk.green('Package restored successfully!'));
        console.log('To build the application, type: ' + chalk.yellow('ipack'));
    }
}
exports.Scaffold = Scaffold;
