#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const chalk_1 = __importDefault(require("chalk"));
const instapack = require("./index");
const VariablesFactory_1 = require("./VariablesFactory");
const manifest = require('../package.json');
let projectFolder = process.cwd();
let ipack = new instapack(projectFolder);
yargs_1.default.version(manifest.version);
function echo(command, subCommand) {
    if (!subCommand) {
        subCommand = '';
    }
    console.log(chalk_1.default.yellow(manifest.name) + ' ' + chalk_1.default.green(manifest.version) + ' ' + command + ' ' + subCommand);
    console.log();
}
yargs_1.default.command({
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
        }).option('map', {
            alias: 'm',
            describe: 'Enables source maps, producing browser-debuggable outputs.'
        }).option('env', {
            describe: 'Defines process.env variables to be replaced in TypeScript project build.'
        }).option('stats', {
            describe: 'Generates webpack stats.json next to the TypeScript build outputs for analysis.'
        }).option('v', {
            alias: 'verbose',
            describe: 'Trace diagnostic outputs for debugging instapack.'
        });
    },
    handler: argv => {
        let subCommand = argv.project || 'all';
        echo('build', subCommand);
        ipack.build(subCommand, {
            production: !Boolean(argv.dev),
            watch: Boolean(argv.watch),
            sourceMap: Boolean(argv.map),
            env: new VariablesFactory_1.VariablesFactory().parseCliEnv(argv.env),
            stats: Boolean(argv.stats),
            hot: Boolean(argv.hot),
            verbose: Boolean(argv.verbose)
        });
    }
});
yargs_1.default.command({
    command: 'new [template]',
    describe: 'Scaffolds new TypeScript + Sass projects!',
    builder: yargs => {
        return yargs.choices('template', ipack.availableTemplates);
    },
    handler: argv => {
        let subCommand = argv.template || 'vue';
        echo('new', subCommand);
        ipack.scaffold(subCommand);
    }
});
yargs_1.default.command({
    command: 'set <key> <value>',
    describe: 'Change a global setting.',
    builder: yargs => {
        return yargs.choices('key', ipack.availableSettings);
    },
    handler: argv => {
        echo('set', argv.key);
        ipack.changeUserSettings(argv.key, argv.value);
    }
});
let parse = yargs_1.default.strict().help().argv;
