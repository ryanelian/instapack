"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const upath = require("upath");
const ReadProjectSettings_1 = require("./ReadProjectSettings");
const root = process.cwd();
const fixtures = upath.join(root, 'fixtures');
ava_1.default.before(() => {
    global.console.error = () => { };
    global.console.warn = () => { };
});
ava_1.default('Project Settings: Not Found', async (t) => {
    const folder = upath.join(fixtures, 'Empty');
    const settings = await ReadProjectSettings_1.readProjectSettingsFrom(folder);
    const result = {
        root: upath.toUnix(folder),
        input: 'client',
        output: 'wwwroot',
        jsOut: 'ipack.js',
        cssOut: 'ipack.css',
        alias: {},
        externals: {},
        namespace: undefined,
        umdLibraryProject: false,
        copy: [],
        port1: 0
    };
    t.deepEqual(settings, result);
});
ava_1.default('Project Settings: Invalid', async (t) => {
    const folder = upath.join(fixtures, 'ProjectSettingsInvalid');
    await t.throwsAsync(async () => {
        await ReadProjectSettings_1.readProjectSettingsFrom(folder);
    });
});
ava_1.default('Project Settings: Valid', async (t) => {
    const folder = upath.join(fixtures, 'ProjectSettingsValid');
    const settings = await ReadProjectSettings_1.readProjectSettingsFrom(folder);
    const result = {
        root: upath.toUnix(folder),
        input: 'src',
        output: 'www',
        jsOut: 'bundle.js',
        cssOut: 'bundle.css',
        alias: {
            'vue': 'vue/dist/vue.esm'
        },
        externals: {
            jquery: '$'
        },
        namespace: 'instapack',
        umdLibraryProject: true,
        copy: [],
        port1: 32101
    };
    t.deepEqual(settings, result);
});
