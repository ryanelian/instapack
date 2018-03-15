#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const instapack = require("./index");
const program = require("yargs");
const chalk_1 = require("chalk");
const Meta_1 = require("./Meta");
let projectFolder = process.cwd();
let app = new instapack(projectFolder);
let meta = new Meta_1.Meta();
meta.checkForUpdates();
program.version(meta.version);
function echo(command, subCommand) {
    if (!subCommand) {
        subCommand = '';
    }
    console.log(chalk_1.default.yellow(meta.name) + ' ' + chalk_1.default.green(meta.version) + ' ' + command + ' ' + subCommand);
    console.log();
}
program.command({
    command: 'build [project]',
    describe: 'Builds the web application client project!',
    aliases: ['*'],
    builder: yargs => {
        return yargs.choices('project', app.availableTasks)
            .option('w', {
            alias: 'watch',
            describe: 'Enables automatic incremental build on source code changes.'
        }).option('d', {
            alias: 'dev',
            describe: 'Disables build outputs optimization and minification.'
        }).option('x', {
            alias: 'xdebug',
            describe: 'Disables source maps, producing undebuggable outputs.'
        }).option('a', {
            alias: 'analyze',
            describe: 'Generates module size report for TypeScript build output.'
        }).option('n', {
            alias: 'noisy',
            describe: 'Annoys you on build fails.'
        }).option('v', {
            alias: 'verbose',
            describe: 'Trace diagnostic outputs for debugging instapack.'
        });
    },
    handler: argv => {
        let subCommand = argv.project || 'all';
        echo('build', subCommand);
        app.build(subCommand, {
            production: !Boolean(argv.dev),
            watch: Boolean(argv.watch),
            sourceMap: !Boolean(argv.uncharted),
            analyze: Boolean(argv.analyze)
        });
    }
});
program.command({
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
program.command({
    command: 'clean',
    describe: 'Remove files in output folder.',
    handler: argv => {
        echo('clean', null);
        app.clean();
    }
});
program.command({
    command: 'set <configuration> <value>',
    describe: 'Change instapack global configuration.',
    builder: yargs => {
        return yargs.choices('configuration', ['package-manager']);
    },
    handler: argv => {
        echo('set', argv.configuration);
        app.setGlobalConfiguration(argv.configuration, argv.value);
    }
});
let parse = program.strict().help().argv;
process.on('exit', () => {
    meta.updateNag();
});
process.on('SIGINT', () => {
    meta.updateNag();
    process.exit(2);
});
