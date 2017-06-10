#!/usr/bin/env node

import { instapack } from './index';
import * as CLI from 'yargs';
import * as chalk from 'chalk';

let packageJSON = require('./package.json');
let packageInfo = {
    name: packageJSON.name as string,
    version: packageJSON.version as string,
    description: packageJSON.description as string
};

let app = new instapack();
CLI.version(packageInfo.version);

/**
 * Writes application name, version number, command and sub-command to the console output.
 * @param command 
 * @param subCommand 
 * @param writeDescription 
 */
function echo(command: string, subCommand: string, writeDescription = false) {
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
            });
    },
    handler: argv => {
        let subCommand = argv.project || 'all';

        echo('build', subCommand);
        app.build(subCommand, !argv.dev, argv.watch);
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
//console.log(parse);
