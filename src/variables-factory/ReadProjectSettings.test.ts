import test from "ava";
import * as upath from 'upath';

import { isValidExternals, readProjectSettingsFrom } from "./ReadProjectSettings";
import { IProjectSettings } from "./IProjectSettings";

let root = process.cwd();
let fixtures = upath.join(root, 'fixtures');

test('Project Settings: Not Found', async t => {
    let folder = upath.join(fixtures, 'Empty');
    let settings = await readProjectSettingsFrom(folder);
    let result: IProjectSettings = {
        root: upath.toUnix(folder),
        input: 'client',
        output: 'wwwroot',
        jsOut: 'ipack.js',
        cssOut: 'ipack.css',

        alias: {},
        externals: {},
        port1: 0,
        port2: 0
    };

    t.deepEqual(settings, result);
});

test('Project Settings: Invalid', async t => {
    let folder = upath.join(fixtures, 'ProjectSettingsInvalid');
    let settings = await readProjectSettingsFrom(folder);
    let result: IProjectSettings = {
        root: upath.toUnix(folder),
        input: 'client',
        output: 'wwwroot',
        jsOut: 'ipack.js',
        cssOut: 'ipack.css',

        alias: {},
        externals: {},
        port1: 0,
        port2: 0
    };

    t.deepEqual(settings, result);
});

test('Project Settings: Valid', async t => {
    let folder = upath.join(fixtures, 'ProjectSettingsValid');
    let settings = await readProjectSettingsFrom(folder);
    let result: IProjectSettings = {
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
        port1: 32101,
        port2: 32102
    };

    t.deepEqual(settings, result);
});

test('Valid Externals: Simple String', t => {
    let a = isValidExternals('$');
    t.is(a, true);
});

test('Valid Externals: undefined', t => {
    let a = isValidExternals(undefined);
    t.is(a, false);
});

test('Valid Externals: null', t => {
    let a = isValidExternals(null);
    t.is(a, false);
});

test('Valid Externals: number', t => {
    let a = isValidExternals(12345);
    t.is(a, false);
});

test('Valid Externals: boolean', t => {
    let a = isValidExternals(true);
    t.is(a, false);
});

test('Valid Externals: Array of String', t => {
    let a = isValidExternals(['./math', 'subtract']);
    t.is(a, true);
});

test('Valid Externals: Array of NOT String', t => {
    let a = isValidExternals([0, 1]);
    t.is(a, false);
});

test('Valid Externals: Object', t => {
    let a = isValidExternals({
        lodash: {
            commonjs: 'lodash',
            amd: 'lodash',
            root: '_' // indicates global variable
        }
    });
    t.is(a, true);
});
