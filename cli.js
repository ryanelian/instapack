#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const CLI = require("yargs");
const chalk = require("chalk");
let packageJSON = require('./package.json');
let packageInfo = {
    name: packageJSON.name,
    version: packageJSON.version,
    description: packageJSON.description
};
let app = new index_1.instapack();
CLI.version(packageInfo.version);
function echo(command, subCommand, writeDescription = false) {
    if (!subCommand) {
        subCommand = '';
    }
    console.log(chalk.yellow(packageInfo.name) + ' ' + chalk.green(packageInfo.version) + ' ' + command + ' ' + subCommand);
    if (writeDescription) {
        console.log(packageInfo.description);
    }
    console.log();
}
CLI.command({
    command: 'build [project]',
    describe: 'Compiles the web application client project.',
    aliases: ['*'],
    builder: yargs => {
        return yargs.choices('project', app.availableTasks)
            .option('w', {
            alias: 'watch',
            describe: 'Enables rebuild on source code changes.'
        }).option('d', {
            alias: 'dev',
            describe: 'Disables output files minification.'
        }).option('s', {
            alias: 'server',
            describe: 'Serve the output using an HTTP server of the specified port. (Enables watch mode)',
            type: 'number'
        });
    },
    handler: argv => {
        let subCommand = argv.project || 'all';
        echo('build', subCommand);
        app.build(subCommand, !argv.dev, argv.watch, argv.server);
    }
});
CLI.command({
    command: 'new [template]',
    describe: 'Scaffolds a new web application client project.',
    builder: yargs => {
        return yargs.choices('template', app.availableTemplates);
    },
    handler: argv => {
        let subCommand = argv.template || 'aspnet';
        echo('new', subCommand);
        app.scaffold(subCommand);
    }
});
CLI.command({
    command: 'apinfo',
    describe: 'Displays browser list used by autoprefixer, their statistics, and prefix rules.',
    handler: argv => {
        echo('autoprefix-info', null);
        app.displayAutoprefixInfo();
    }
});
CLI.command({
    command: 'settings',
    describe: 'Displays settings loaded from package.json, if exists.',
    handler: argv => {
        echo('settings', null);
        app.displaySettings();
    }
});
let parse = CLI.strict().help().argv;
