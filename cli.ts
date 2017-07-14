#!/usr/bin/env node

import instapack = require('./index');
import * as CLI from 'yargs';
import * as chalk from 'chalk';
import * as https from 'https';

import * as autoprefixer from 'autoprefixer';
import * as prettyJSON from 'prettyjson';

let packageJSON = require('./package.json');
let packageInfo = {
    name: packageJSON.name as string,
    version: packageJSON.version as string,
    description: packageJSON.description as string
};

let outdated = false;
let masterVersion = packageInfo.version;

let updater = https.get('https://raw.githubusercontent.com/ryanelian/instapack/master/package.json', response => {

    let body = '';
    response.setEncoding('utf8');
    response.on('data', data => {
        body += data;
    });

    response.on('end', () => {
        try {
            let json = JSON.parse(body);
            masterVersion = json.version;
            outdated = masterVersion > packageInfo.version;
        } catch (error) {
            outdated = false;
            masterVersion = 'ERROR';
        }
    });

}).on('error', () => { });

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
            }).option('s', {
                alias: 'server',
                describe: 'Serve the output using an HTTP server listening on a local port.',
                //default: 19991,
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
    command: 'info',
    describe: 'Displays instapack dependencies, loaded settings, and autoprefixer information.',
    handler: argv => {
        echo('info', null);

        let pinfo = prettyJSON.render({
            dependencies: packageJSON.dependencies,
            settings: app.settings
        }, { noColor: true });

        console.log(pinfo);
        console.log();
        console.log(autoprefixer().info());
    }
});

let parse = CLI.strict().help().argv;
//console.log(parse);

function updateNag() {
    updater.abort();

    if (outdated) {
        console.log();
        console.log(chalk.yellow('instapack') + ' is outdated. New version: ' + chalk.green(masterVersion));
        console.log('Run ' + chalk.blue('yarn global upgrade instapack') + ' or ' + chalk.blue('npm update -g instapack') + ' to update!');
    }

    // Prevent displaying message more than once... (Happens during SIGINT)
    outdated = false;
}

process.on('exit', () => {
    updateNag();
});

// Catch CTRL+C event then exit normally.
process.on('SIGINT', () => {
    updateNag();
    process.exit(2);
});
