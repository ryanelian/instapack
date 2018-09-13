import test from 'ava';
import { VariablesFactory } from "./VariablesFactory";
import upath from 'upath';
import { IProjectSettings } from "./interfaces/IProjectSettings";
import { IVariables } from './interfaces/IVariables';

let v = new VariablesFactory();
let root = process.cwd();
let fixtures = upath.join(root, 'fixtures');

test('Project Settings: Not Found', async t => {
    let folder = upath.join(fixtures, 'Empty');
    let settings = await v.readProjectSettingsFrom(folder);
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
    let settings = await v.readProjectSettingsFrom(folder);
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
    let settings = await v.readProjectSettingsFrom(folder);
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
    let a = v.isValidExternals('$');
    t.is(a, true);
});

test('Valid Externals: undefined', t => {
    let a = v.isValidExternals(undefined);
    t.is(a, false);
});

test('Valid Externals: null', t => {
    let a = v.isValidExternals(null);
    t.is(a, false);
});

test('Valid Externals: number', t => {
    let a = v.isValidExternals(12345);
    t.is(a, false);
});

test('Valid Externals: boolean', t => {
    let a = v.isValidExternals(true);
    t.is(a, false);
});

test('Valid Externals: Array of String', t => {
    let a = v.isValidExternals(['./math', 'subtract']);
    t.is(a, true);
});

test('Valid Externals: Array of NOT String', t => {
    let a = v.isValidExternals([0, 1]);
    t.is(a, false);
});

test('Valid Externals: Object', t => {
    let a = v.isValidExternals({
        lodash: {
            commonjs: 'lodash',
            amd: 'lodash',
            root: '_' // indicates global variable
        }
    });
    t.is(a, true);
});

test('Read .env File: Valid', async t => {
    let folder = upath.join(fixtures, 'DotEnvValid');
    let r = await v.readDotEnvFrom(folder);
    t.deepEqual(r, {
        foo: 'undefined',
        bar: 'null',
        magic: 'true',
        x: '777',
        nil: ''
    });
});

test('Read .env File: Invalid', async t => {
    let folder = upath.join(fixtures, 'DotEnvInvalid');
    let r = await v.readDotEnvFrom(folder);
    t.deepEqual(r, {});
});

test('Read .env File: Not Found', async t => {
    let folder = upath.join(fixtures, 'Empty');
    let r = await v.readDotEnvFrom(folder);

    t.deepEqual(r, {});
});

test('Parse CLI env: Valid', t => {
    let r = v.parseCliEnv({
        foo: 'bar',
        x: 777,
        magic: true
    });

    t.deepEqual(r, {
        foo: 'bar',
        x: '777',
        magic: 'true'
    })
});

test('Parse CLI env: Invalid String', t => {
    // --env=true
    let r = v.parseCliEnv('true');
    t.deepEqual(r, {});
});

test('Parse CLI env: Invalid Boolean', t => {
    // --env
    let r = v.parseCliEnv(true);
    t.deepEqual(r, {});
});

test('Parse CLI env: Invalid Number', t => {
    // --env=9999
    let r = v.parseCliEnv(9999);
    t.deepEqual(r, {});
});

test('Parse CLI env: Invalid Array', t => {
    // --env=a --env=b --env=c
    let r = v.parseCliEnv(['a', 'b', 'c']);
    t.deepEqual(r, {});
});

test('Compile Variables: Simple', t => {
    let result = v.compile(
        {
            env: {
                foo: 'bar'
            },
            hot: false,
            production: true,
            watch: false,
            sourceMap: true,
            stats: true,
            verbose: false
        },
        {
            root: __dirname,
            input: 'client',
            output: 'wwwroot',
            jsOut: 'ipack.js',
            cssOut: 'ipack.css',

            alias: {},
            externals: {},
            port1: 0,
            port2: 0
        },
        {
            muteNotification: false,
            packageManager: 'yarn'
        },
        {
            hello: 'world'
        });

    let expected: IVariables = {
        root: __dirname,
        input: 'client',
        output: 'wwwroot',
        jsOut: 'ipack.js',
        cssOut: 'ipack.css',

        alias: {},
        externals: {},
        port1: 0,
        port2: 0,
        muteNotification: false,
        packageManager: 'yarn',
        env: {
            foo: 'bar',
            hello: 'world'
        },
        hot: false,
        production: true,
        watch: false,
        sourceMap: true,
        stats: true,
        verbose: false
    }

    t.deepEqual(result, expected);
});

test('Compile Variables: Overrides', t => {
    let result = v.compile(
        {
            env: {
                foo: 'bar',
            },
            hot: true,
            production: true,
            watch: false,
            sourceMap: false,
            stats: true,
            verbose: true
        },
        {
            root: __dirname,
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
            port1: 20178,
            port2: 20179
        },
        {
            muteNotification: true,
            packageManager: 'npm'
        },
        {
            foo: 'zero'
        });

    let expected: IVariables = {
        root: __dirname,
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
        port1: 20178,
        port2: 20179,
        muteNotification: true,
        packageManager: 'npm',
        env: {
            foo: 'bar'
        },
        hot: true,
        production: false,
        watch: true,
        sourceMap: false,
        stats: false,
        verbose: true
    }

    t.deepEqual(result, expected);
});
