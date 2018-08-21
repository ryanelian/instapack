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
    describe: 'Builds the web application!',
    aliases: ['*'],
    builder: yargs => {
        return yargs.choices('project', app.availableTasks)
            .option('watch', {
            alias: 'w',
            describe: 'Enables automatic incremental build on source code changes.'
        }).option('dev', {
            alias: 'd',
            describe: 'Disables build outputs optimization and minification.'
        }).option('xdebug', {
            alias: 'x',
            describe: 'Disables source maps, producing undebuggable outputs.'
        }).option('env', {
            describe: 'Defines process.env variables to be replaced in TypeScript project build.'
        }).option('stats', {
            describe: 'Generates webpack stats.json next to the TypeScript build outputs for analysis.'
        }).option('h', {
            alias: 'hot',
            describe: 'Enables Hot Reload development mode using dedicated build servers.'
        });
    },
    handler: argv => {
        let subCommand = argv.project || 'all';
        let cliEnv = {};
        if (argv.env && typeof argv.env === 'object' && !Array.isArray(argv.env)) {
            cliEnv = argv.env;
            for (let key in cliEnv) {
                cliEnv[key] = cliEnv[key].toString();
            }
        }
        echo('build', subCommand);
        app.build(subCommand, {
            production: !Boolean(argv.dev),
            watch: Boolean(argv.watch),
            sourceMap: !Boolean(argv.xdebug),
            env: cliEnv,
            stats: Boolean(argv.stats),
            hot: Boolean(argv.hot)
        });
    }
});
program.command({
    command: 'new [template]',
    describe: 'Scaffolds new TypeScript + Sass projects!',
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
    command: 'set <key> <value>',
    describe: 'Change a global setting.',
    builder: yargs => {
        return yargs.choices('key', app.availableSettings);
    },
    handler: argv => {
        echo('set', argv.key);
        app.changeGlobalSetting(argv.key, argv.value);
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
