import test from "ava";
import * as upath from 'upath';

import { readProjectSettingsFrom } from "./ReadProjectSettings";
import { ProjectSettings } from "./ProjectSettings";

const root = process.cwd();
const fixtures = upath.join(root, 'fixtures');

test('Project Settings: Not Found', async t => {
    const folder = upath.join(fixtures, 'Empty');
    const settings = await readProjectSettingsFrom(folder);
    const result: ProjectSettings = {
        root: upath.toUnix(folder),
        input: 'client',
        output: 'wwwroot',
        jsOut: 'ipack.js',
        cssOut: 'ipack.css',

        alias: {},
        externals: {},
        namespace: undefined,
        copy: [],
        port1: 0,
    };

    t.deepEqual(settings, result);
});

test('Project Settings: Invalid', async t => {
    // let result: IProjectSettings = {
    //     root: upath.toUnix(folder),
    //     input: 'client',
    //     output: 'wwwroot',
    //     jsOut: 'ipack.js',
    //     cssOut: 'ipack.css',

    //     alias: {},
    //     externals: {},
    //     namespace: undefined,
    //     copy: [],
    //     port1: 0,
    // };

    const folder = upath.join(fixtures, 'ProjectSettingsInvalid');
    await t.throwsAsync(async () => {
        await readProjectSettingsFrom(folder);
    });
});

test('Project Settings: Valid', async t => {
    const folder = upath.join(fixtures, 'ProjectSettingsValid');
    const settings = await readProjectSettingsFrom(folder);
    const result: ProjectSettings = {
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
        copy: [],
        port1: 32101,
    };

    t.deepEqual(settings, result);
});
