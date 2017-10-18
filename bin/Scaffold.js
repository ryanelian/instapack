"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fse = require("fs-extra");
const path = require("path");
const cp = require("child_process");
const chalk_1 = require("chalk");
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
            console.log(chalk_1.default.red('Package restore using Yarn failed.') + ' Attempting package restore using NPM...');
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
            console.log('Unable to find new project template for: ' + chalk_1.default.red(name));
            return;
        }
        console.log('Initializing new project using template: ' + chalk_1.default.cyan(name));
        console.log('Scaffolding project into your web application...');
        fse.copySync(templateFolder, thisFolder);
        console.log(chalk_1.default.green('Scaffold completed.') + ' Restoring packages for you...');
        this.restorePackages();
        console.log(chalk_1.default.green('Package restored successfully!'));
        console.log('To build the application, type: ' + chalk_1.default.yellow('ipack'));
    }
}
exports.Scaffold = Scaffold;
