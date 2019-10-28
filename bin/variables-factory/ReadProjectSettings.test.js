"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const upath = require("upath");
const ReadProjectSettings_1 = require("./ReadProjectSettings");
let root = process.cwd();
let fixtures = upath.join(root, 'fixtures');
ava_1.default('Project Settings: Not Found', (t) => __awaiter(void 0, void 0, void 0, function* () {
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
        namespace: undefined,
        copy: [],
        port1: 0,
    };
    t.deepEqual(settings, result);
}));
ava_1.default('Project Settings: Invalid', (t) => __awaiter(void 0, void 0, void 0, function* () {
    let folder = upath.join(fixtures, 'ProjectSettingsInvalid');
    yield t.throwsAsync(() => __awaiter(void 0, void 0, void 0, function* () {
        yield ReadProjectSettings_1.readProjectSettingsFrom(folder);
    }));
}));
ava_1.default('Project Settings: Valid', (t) => __awaiter(void 0, void 0, void 0, function* () {
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
        namespace: 'instapack',
        copy: [],
        port1: 32101,
    };
    t.deepEqual(settings, result);
}));
