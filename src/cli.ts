#!/usr/bin/env node

import instapack = require('./index');
import * as CLI from 'yargs';
import chalk from 'chalk';
import * as https from 'https';

import * as autoprefixer from 'autoprefixer';
import { PrettyObject } from './PrettyObject';

const packageJSON = require('../package.json');
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
 * Writes app name, version number, command and sub-command to the console output.
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
    describe: 'Builds the web app client project!',
    aliases: ['*'],
    builder: yargs => {
        return yargs.choices('project', app.availableTasks)
            .option('w', {
                alias: 'watch',
                describe: 'Enables rebuild on source code changes.'
            }).option('d', {
                alias: 'dev',
                describe: 'Disables output files minification.'
            }).option('u', {
                alias: 'unmap',
                describe: 'Disables source maps.'
            });
    },
    handler: argv => {
        let subCommand = argv.project || 'all';

        echo('build', subCommand);
        app.build(subCommand, {
            production: !argv.dev,
            watch: argv.watch,
            sourceMap: !argv.unmap
        });
    }
});

CLI.command({
    command: 'clean',
    describe: 'Remove files in output folder.',
    handler: argv => {
        echo('clean', null);
        app.clean();
    }
});

CLI.command({
    command: 'new [template]',
    describe: 'Scaffolds a new web app client project.',
    builder: yargs => {
        return yargs.choices('template', app.availableTemplates);
    },
    handler: argv => {
        let subCommand = argv.template || 'vue';

        echo('new', subCommand);
        app.scaffold(subCommand);
    }
});

CLI.command({
    command: 'info',
    describe: 'Displays instapack dependencies, loaded configurations, and autoprefixer information.',
    handler: argv => {
        echo('info', null);

        let p = new PrettyObject('whiteBright');
        let pinfo = p.render({
            dependencies: packageJSON.dependencies,
            settings: app.settings
        });

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
