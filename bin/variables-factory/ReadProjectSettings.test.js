"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const upath = require("upath");
const ReadProjectSettings_1 = require("./ReadProjectSettings");
let root = process.cwd();
let fixtures = upath.join(root, 'fixtures');
ava_1.default('Project Settings: Not Found', (t) => __awaiter(this, void 0, void 0, function* () {
    let folder = upath.join(fixtures, 'Empty');
    let settings = yield ReadProjectSettings_1.readProjectSettingsFrom(folder);
    let result = {
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
}));
ava_1.default('Project Settings: Invalid', (t) => __awaiter(this, void 0, void 0, function* () {
    let folder = upath.join(fixtures, 'ProjectSettingsInvalid');
    let settings = yield ReadProjectSettings_1.readProjectSettingsFrom(folder);
    let result = {
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
}));
ava_1.default('Project Settings: Valid', (t) => __awaiter(this, void 0, void 0, function* () {
    let folder = upath.join(fixtures, 'ProjectSettingsValid');
    let settings = yield ReadProjectSettings_1.readProjectSettingsFrom(folder);
    let result = {
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
}));
ava_1.default('Valid Externals: Simple String', t => {
    let a = ReadProjectSettings_1.isValidExternals('$');
    t.is(a, true);
});
ava_1.default('Valid Externals: undefined', t => {
    let a = ReadProjectSettings_1.isValidExternals(undefined);
    t.is(a, false);
});
ava_1.default('Valid Externals: null', t => {
    let a = ReadProjectSettings_1.isValidExternals(null);
    t.is(a, false);
});
ava_1.default('Valid Externals: number', t => {
    let a = ReadProjectSettings_1.isValidExternals(12345);
    t.is(a, false);
});
ava_1.default('Valid Externals: boolean', t => {
    let a = ReadProjectSettings_1.isValidExternals(true);
    t.is(a, false);
});
ava_1.default('Valid Externals: Array of String', t => {
    let a = ReadProjectSettings_1.isValidExternals(['./math', 'subtract']);
    t.is(a, true);
});
ava_1.default('Valid Externals: Array of NOT String', t => {
    let a = ReadProjectSettings_1.isValidExternals([0, 1]);
    t.is(a, false);
});
ava_1.default('Valid Externals: Object', t => {
    let a = ReadProjectSettings_1.isValidExternals({
        lodash: {
            commonjs: 'lodash',
            amd: 'lodash',
            root: '_'
        }
    });
    t.is(a, true);
});
