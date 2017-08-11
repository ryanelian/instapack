#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const instapack = require("./index");
const CLI = require("yargs");
const chalk = require("chalk");
const https = require("https");
const autoprefixer = require("autoprefixer");
const prettyJSON = require("prettyjson");
const packageJSON = require('../package.json');
let packageInfo = {
    name: packageJSON.name,
    version: packageJSON.version,
    description: packageJSON.description
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
        }
        catch (error) {
            outdated = false;
            masterVersion = 'ERROR';
        }
    });
}).on('error', () => { });
let app = new instapack();
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
        }).option('u', {
            alias: 'unmap',
            describe: 'Disables sourcemaps.'
        }).option('s', {
            alias: 'server',
            describe: 'Serve the output using an HTTP server listening on a local port.',
            type: 'number'
        });
    },
    handler: argv => {
        let subCommand = argv.project || 'all';
        echo('build', subCommand);
        app.build(subCommand, !argv.dev, argv.watch, !argv.unmap, argv.server);
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
function updateNag() {
    updater.abort();
    if (outdated) {
        console.log();
        console.log(chalk.yellow('instapack') + ' is outdated. New version: ' + chalk.green(masterVersion));
        console.log('Run ' + chalk.blue('yarn global upgrade instapack') + ' or ' + chalk.blue('npm update -g instapack') + ' to update!');
    }
    outdated = false;
}
process.on('exit', () => {
    updateNag();
});
process.on('SIGINT', () => {
    updateNag();
    process.exit(2);
});
