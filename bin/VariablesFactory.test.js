"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const VariablesFactory_1 = require("./VariablesFactory");
const upath_1 = __importDefault(require("upath"));
let v = new VariablesFactory_1.VariablesFactory();
let root = process.cwd();
let fixtures = upath_1.default.join(root, 'fixtures');
ava_1.default('Project Settings: Not Found', (t) => __awaiter(this, void 0, void 0, function* () {
    let folder = upath_1.default.join(fixtures, 'Empty');
    let settings = yield v.readProjectSettingsFrom(folder);
    let result = {
        root: upath_1.default.toUnix(folder),
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
}));
ava_1.default('Project Settings: Invalid', (t) => __awaiter(this, void 0, void 0, function* () {
    let folder = upath_1.default.join(fixtures, 'ProjectSettingsInvalid');
    let settings = yield v.readProjectSettingsFrom(folder);
    let result = {
        root: upath_1.default.toUnix(folder),
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
}));
ava_1.default('Project Settings: Valid', (t) => __awaiter(this, void 0, void 0, function* () {
    let folder = upath_1.default.join(fixtures, 'ProjectSettingsValid');
    let settings = yield v.readProjectSettingsFrom(folder);
    let result = {
        root: upath_1.default.toUnix(folder),
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
}));
ava_1.default('Valid Externals: Simple String', t => {
    let a = v.isValidExternals('$');
    t.is(a, true);
});
ava_1.default('Valid Externals: undefined', t => {
    let a = v.isValidExternals(undefined);
    t.is(a, false);
});
ava_1.default('Valid Externals: null', t => {
    let a = v.isValidExternals(null);
    t.is(a, false);
});
ava_1.default('Valid Externals: number', t => {
    let a = v.isValidExternals(12345);
    t.is(a, false);
});
ava_1.default('Valid Externals: boolean', t => {
    let a = v.isValidExternals(true);
    t.is(a, false);
});
ava_1.default('Valid Externals: Array of String', t => {
    let a = v.isValidExternals(['./math', 'subtract']);
    t.is(a, true);
});
ava_1.default('Valid Externals: Array of NOT String', t => {
    let a = v.isValidExternals([0, 1]);
    t.is(a, false);
});
ava_1.default('Valid Externals: Object', t => {
    let a = v.isValidExternals({
        lodash: {
            commonjs: 'lodash',
            amd: 'lodash',
            root: '_'
        }
    });
    t.is(a, true);
});
ava_1.default('Read .env File: Valid', (t) => __awaiter(this, void 0, void 0, function* () {
    let folder = upath_1.default.join(fixtures, 'DotEnvValid');
    let r = yield v.readDotEnvFrom(folder);
    t.deepEqual(r, {
        foo: 'undefined',
        bar: 'null',
        magic: 'true',
        x: '777',
        nil: ''
    });
}));
ava_1.default('Read .env File: Invalid', (t) => __awaiter(this, void 0, void 0, function* () {
    let folder = upath_1.default.join(fixtures, 'DotEnvInvalid');
    let r = yield v.readDotEnvFrom(folder);
    t.deepEqual(r, {});
}));
ava_1.default('Read .env File: Not Found', (t) => __awaiter(this, void 0, void 0, function* () {
    let folder = upath_1.default.join(fixtures, 'Empty');
    let r = yield v.readDotEnvFrom(folder);
    t.deepEqual(r, {});
}));
ava_1.default('Parse CLI env: Valid', t => {
    let r = v.parseCliEnv({
        foo: 'bar',
        x: 777,
        magic: true
    });
    t.deepEqual(r, {
        foo: 'bar',
        x: '777',
        magic: 'true'
    });
});
ava_1.default('Parse CLI env: Invalid String', t => {
    let r = v.parseCliEnv('true');
    t.deepEqual(r, {});
});
ava_1.default('Parse CLI env: Invalid Boolean', t => {
    let r = v.parseCliEnv(true);
    t.deepEqual(r, {});
});
ava_1.default('Parse CLI env: Invalid Number', t => {
    let r = v.parseCliEnv(9999);
    t.deepEqual(r, {});
});
ava_1.default('Parse CLI env: Invalid Array', t => {
    let r = v.parseCliEnv(['a', 'b', 'c']);
    t.deepEqual(r, {});
});
ava_1.default('Compile Variables: Simple', t => {
    let result = v.compile({
        env: {
            foo: 'bar'
        },
        hot: false,
        production: true,
        watch: false,
        sourceMap: true,
        stats: true,
        verbose: false
    }, {
        root: __dirname,
        input: 'client',
        output: 'wwwroot',
        jsOut: 'ipack.js',
        cssOut: 'ipack.css',
        alias: {},
        externals: {},
        port1: 0,
        port2: 0
    }, {
        muteNotification: false,
        packageManager: 'yarn'
    }, {
        hello: 'world'
    });
    let expected = {
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
    };
    t.deepEqual(result, expected);
});
ava_1.default('Compile Variables: Overrides', t => {
    let result = v.compile({
        env: {
            foo: 'bar',
        },
        hot: true,
        production: true,
        watch: false,
        sourceMap: false,
        stats: true,
        verbose: true
    }, {
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
    }, {
        muteNotification: true,
        packageManager: 'npm'
    }, {
        foo: 'zero'
    });
    let expected = {
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
    };
    t.deepEqual(result, expected);
});
