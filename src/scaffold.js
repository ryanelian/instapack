'use strict';

let fs = require('fs-extra');
let path = require('path');
let exec = require("child_process").execSync;
let chalk = require('chalk');

function execWithConsoleOutput(command) {
    let e = exec(command, { stdio: [0, 1, 2] }); // inherit
    // e.stdout.pipe(process.stdout);
    // e.stderr.pipe(process.stderr);
    return e;
};

module.exports = function (name) {
    let templateFolder = path.join(__dirname, '../templates', name);
    let thisFolder = process.cwd();

    let exist = fs.existsSync(templateFolder);
    if (!exist) {
        console.log('Unable to find new project template for: ' + chalk.red(name));
        return;
    }

    console.log('Initializing new project using template: ' + chalk.cyan(name));
    console.log('Scaffolding project into your web application...');
    fs.copySync(templateFolder, thisFolder);
    console.log(chalk.green('Scaffold completed.') + ' Restoring packages for you...');
    console.log();

    try {
        execWithConsoleOutput('yarn');
    }
    catch (err) {
        console.log();
        console.log(chalk.red('Package restore using Yarn failed.') + ' Attempting package restore using NPM...');
        console.log();
        execWithConsoleOutput('npm update');
        // if NPM fails, tough luck.
    }

    console.log();
    console.log(chalk.green('Package restored successfully!'));
    console.log('To build the application, type: ' + chalk.yellow('ipack'));
};

