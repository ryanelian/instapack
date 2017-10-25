#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const instapack = require("./index");
const CLI = require("yargs");
const chalk_1 = require("chalk");
const https = require("https");
const autoprefixer = require("autoprefixer");
const PrettyObject_1 = require("./PrettyObject");
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
    console.log(chalk_1.default.yellow(packageInfo.name) + ' ' + chalk_1.default.green(packageInfo.version) + ' ' + command + ' ' + subCommand);
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
            describe: 'Enables incremental compilation on source code changes.'
        }).option('d', {
            alias: 'dev',
            describe: 'Disables JS build output minification and optimizations.'
        }).option('o', {
            alias: 'obfuscate',
            describe: 'Disables source maps.'
        }).option('p', {
            alias: 'parallel',
            describe: 'Enables parallel build across all logical processors!'
        });
    },
    handler: argv => {
        let subCommand = argv.project || 'all';
        echo('build', subCommand);
        app.build(subCommand, {
            production: !argv.dev,
            watch: argv.watch,
            sourceMap: !argv.obfuscate,
            parallel: argv.parallel
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
        let p = new PrettyObject_1.PrettyObject('whiteBright');
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
function updateNag() {
    updater.abort();
    if (outdated) {
        console.log();
        console.log(chalk_1.default.yellow('instapack') + ' is outdated. New version: ' + chalk_1.default.green(masterVersion));
        if (parseInt(process.versions.node[0]) < 8) {
            console.log(chalk_1.default.red('BEFORE UPDATING: ') + chalk_1.default.yellow('install the latest Node.js LTS version 8 ') + 'for better build performance!');
            console.log('Download URL: ' + chalk_1.default.blue('https://nodejs.org/en/download/'));
        }
        console.log('Run ' + chalk_1.default.yellow('npm install -g instapack') + ' or ' + chalk_1.default.yellow('yarn global add instapack') + ' to update!');
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
