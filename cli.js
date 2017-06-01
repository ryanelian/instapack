#!/usr/bin/env node
import { Instapack } from './index';
import * as CLI from 'yargs';
import * as chalk from 'chalk';
let packageJSON = require('./package.json');
let packageInfo = {
    name: packageJSON.name,
    version: packageJSON.version,
    description: packageJSON
};
let app = new Instapack();
CLI.version(packageInfo.version);
let validCommands = ['all', 'js', 'css', 'concat'];
let validTemplates = ['empty', 'aspnet', 'angularjs'];
function echo(command, subCommand, writeDescription = false) {
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
        return yargs.choices('project', validCommands)
            .option('w', {
            alias: 'watch',
            describe: 'Enables rebuild on source code changes.'
        }).option('d', {
            alias: 'dev',
            describe: 'Disables output files minification.'
        });
    },
    handler: argv => {
        echo('build', argv.project || 'all');
        app.build(argv.project, !argv.dev, argv.watch);
    }
});
CLI.command({
    command: 'new [template]',
    describe: 'Scaffolds a new web application client project.',
    builder: yargs => {
        return yargs.choices('template', validTemplates);
    },
    handler: argv => {
        echo('new', argv.template || 'aspnet');
        app.scaffold(argv.template);
    }
});
let parse = CLI.strict().help().argv;
