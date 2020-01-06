#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("yargs");
const chalk = require("chalk");
const fse = require("fs-extra");
const instapack = require("./index");
const EnvParser_1 = require("./variables-factory/EnvParser");
const UserSettingsManager_1 = require("./user-settings/UserSettingsManager");
const manifest = fse.readJsonSync(require.resolve('../package.json'));
const projectFolder = process.cwd();
const ipack = new instapack(projectFolder);
program.version(manifest.version);
function echo(command, subCommand) {
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
        }).option('serve', {
            alias: 's',
            describe: 'Enables Hot Reload development mode using dedicated build servers.'
        }).option('sourcemaps', {
            default: true,
            describe: 'Enables source maps, which enables debugging build outputs.'
        }).option('env', {
            describe: 'Defines process.env variables to be replaced in TypeScript project build.'
        }).option('stats', {
            describe: 'Generates webpack stats.json next to the TypeScript build outputs for analysis.'
        }).option('overwrite', {
            describe: 'Enables overwriting files in output folder by copy assets build tool.'
        }).option('https', {
            describe: 'Enables HTTPS Hot Reload dev server. (Requires mkcert to be installed)'
        }).option('experimental-react-refresh', {
            describe: 'Enables Fast Refresh for React with dev server.'
        });
    },
    handler: (argv) => {
        let subCommand = 'all';
        if (typeof argv.project === 'string') {
            subCommand = argv.project;
        }
        echo('build', subCommand);
        ipack.build(subCommand, {
            production: !argv.dev,
            watch: Boolean(argv.watch),
            sourceMap: Boolean(argv.sourcemaps),
            env: EnvParser_1.parseCliEnvFlags(argv.env),
            stats: Boolean(argv.stats),
            serve: Boolean(argv.serve),
            https: Boolean(argv.https),
            reactRefresh: Boolean(argv['experimental-react-refresh'])
        }).catch(console.error);
    }
});
program.command({
    command: 'new [template]',
    describe: 'Scaffolds new TypeScript + Sass projects!',
    builder: yargs => {
        return yargs.choices('template', ipack.availableTemplates);
    },
    handler: (argv) => {
        let subCommand = 'vue';
        if (typeof argv.template === 'string') {
            subCommand = argv.template;
        }
        echo('new', subCommand);
        ipack.scaffold(subCommand).catch(console.error);
    }
});
program.command({
    command: 'set <key> <value>',
    describe: 'Change a global setting.',
    builder: yargs => {
        return yargs.choices('key', UserSettingsManager_1.userSettingsOptions);
    },
    handler: (argv) => {
        if (typeof argv.key === 'string' && typeof argv.value === 'string') {
            echo('set', argv.key);
            ipack.changeUserSettings(argv.key, argv.value).catch(console.error);
        }
        else {
            throw new Error(`Argument 'key' and 'value' must be string`);
        }
    }
});
program.strict().help().argv;
