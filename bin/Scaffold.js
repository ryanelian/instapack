"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fse = require("fs-extra");
const upath = require("upath");
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
    usingTemplate(name, toFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            let templateFolder = upath.join(__dirname, '../templates', name);
            let exist = yield fse.pathExists(templateFolder);
            if (!exist) {
                console.error(chalk_1.default.red('ERROR') + ' Unable to find new project template for: ' + chalk_1.default.cyan(name));
                return;
            }
            console.log('Initializing new project using template: ' + chalk_1.default.cyan(name));
            console.log('Scaffolding project into your web app...');
            yield fse.copy(templateFolder, toFolder);
            console.log(chalk_1.default.green('Scaffold completed.') + ' Restoring packages for you...');
            this.restorePackages();
            console.log(chalk_1.default.green('Package restored successfully!'));
            console.log('To build the app, type: ' + chalk_1.default.yellow('ipack'));
        });
    }
}
exports.Scaffold = Scaffold;
