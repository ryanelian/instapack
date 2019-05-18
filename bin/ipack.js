#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("yargs");
const chalk_1 = require("chalk");
const instapack = require("./index");
const EnvParser_1 = require("./variables-factory/EnvParser");
const UserSettingsManager_1 = require("./user-settings/UserSettingsManager");
const manifest = require('../package.json');
let projectFolder = process.cwd();
let ipack = new instapack(projectFolder);
program.version(manifest.version);
function echo(command, subCommand) {
    if (!subCommand) {
        subCommand = '';
    }
    console.log(chalk_1.default.yellow(manifest.name) + ' ' + chalk_1.default.green(manifest.version) + ' ' + command + ' ' + subCommand);
    console.log();
}
program.command({
    command: 'build [project]',
    describe: 'Builds the web application!',
    aliases: ['*'],
    builder: yargs => {
        return yargs.choices('project', ipack.availableBuildTasks)
            .option('watch', {
            alias: 'w',
            describe: 'Enables automatic incremental build on source code changes.'
        }).option('dev', {
            alias: 'd',
            describe: 'Disables build outputs optimization and minification.'
        }).option('hot', {
            alias: 'h',
            describe: 'Enables Hot Reload development mode using dedicated build servers.'
        }).option('nodebug', {
            alias: 'b',
            describe: 'Disables source maps, producing undebuggable outputs.'
        }).option('env', {
            describe: 'Defines process.env variables to be replaced in TypeScript project build.'
        }).option('stats', {
            describe: 'Generates webpack stats.json next to the TypeScript build outputs for analysis.'
        }).option('v', {
            alias: 'verbose',
            describe: 'Trace diagnostic outputs for debugging instapack.'
        });
    },
    handler: (argv) => {
        let subCommand = argv.project || 'all';
        echo('build', subCommand);
        ipack.build(subCommand, {
            production: !Boolean(argv.dev),
            watch: Boolean(argv.watch),
            sourceMap: !Boolean(argv.nodebug),
            env: EnvParser_1.parseCliEnvFlags(argv.env),
            stats: Boolean(argv.stats),
            hot: Boolean(argv.hot),
            verbose: Boolean(argv.verbose)
        });
    }
});
program.command({
    command: 'new [template]',
    describe: 'Scaffolds new TypeScript + Sass projects!',
    builder: yargs => {
        return yargs.choices('template', ipack.availableTemplates);
    },
    handler: (argv) => {
        let subCommand = argv.template || 'vue';
        echo('new', subCommand);
        ipack.scaffold(subCommand);
    }
});
program.command({
    command: 'set <key> <value>',
    describe: 'Change a global setting.',
    builder: yargs => {
        return yargs.choices('key', UserSettingsManager_1.userSettingsOptions);
    },
    handler: (argv) => {
        echo('set', argv.key);
        ipack.changeUserSettings(argv.key, argv.value);
    }
});
let parse = program.strict().help().argv;
