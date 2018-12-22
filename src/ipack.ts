#!/usr/bin/env node

import program = require('yargs');
import chalk from 'chalk';

import instapack = require('./index');
import { parseCliEnvFlags } from './variables-factory/EnvParser';
import { userSettingOptions } from './user-settings/UserSettingsManager';
const manifest = require('../package.json');

let projectFolder = process.cwd();
let ipack = new instapack(projectFolder);
program.version(manifest.version);

/**
 * Writes app name, version number, command and sub-command to the console output.
 * @param command 
 * @param subCommand 
 */
function echo(command: string, subCommand: string) {
    if (!subCommand) {
        subCommand = '';
    }

    console.log(chalk.yellow(manifest.name) + ' ' + chalk.green(manifest.version) + ' ' + command + ' ' + subCommand);
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
    handler: (argv: any) => {
        let subCommand = argv.project || 'all';

        echo('build', subCommand);
        ipack.build(subCommand, {
            production: !Boolean(argv.dev),
            watch: Boolean(argv.watch),
            sourceMap: !Boolean(argv.nodebug),
            env: parseCliEnvFlags(argv.env),
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
    handler: (argv: any) => {
        let subCommand = argv.template || 'vue';

        echo('new', subCommand);
        ipack.scaffold(subCommand);
    }
});

program.command({
    command: 'set <key> <value>',
    describe: 'Change a global setting.',
    builder: yargs => {
        return yargs.choices('key', userSettingOptions);
    },
    handler: (argv: any) => {
        echo('set', argv.key);
        ipack.changeUserSettings(argv.key, argv.value);
    }
});

let parse = program.strict().help().argv;
