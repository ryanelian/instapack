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
const EnvParser_1 = require("./EnvParser");
const root = process.cwd();
const fixtures = upath.join(root, 'fixtures');
ava_1.default('Read .env File: Valid', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const folder = upath.join(fixtures, 'DotEnvValid');
    const r = yield EnvParser_1.readDotEnvFrom(folder);
    t.deepEqual(r, {
        foo: 'undefined',
        bar: 'null',
        magic: 'true',
        x: '777',
        nil: ''
    });
}));
ava_1.default('Read .env File: Invalid', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const folder = upath.join(fixtures, 'DotEnvInvalid');
    const r = yield EnvParser_1.readDotEnvFrom(folder);
    t.deepEqual(r, {});
}));
ava_1.default('Read .env File: Not Found', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const folder = upath.join(fixtures, 'Empty');
    const r = yield EnvParser_1.readDotEnvFrom(folder);
    t.deepEqual(r, {});
}));
ava_1.default('Parse CLI env: Valid', t => {
    const r = EnvParser_1.parseCliEnvFlags({
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
    const r = EnvParser_1.parseCliEnvFlags('true');
    t.deepEqual(r, {});
});
ava_1.default('Parse CLI env: Invalid Boolean', t => {
    const r = EnvParser_1.parseCliEnvFlags(true);
    t.deepEqual(r, {});
});
ava_1.default('Parse CLI env: Invalid Number', t => {
    const r = EnvParser_1.parseCliEnvFlags(9999);
    t.deepEqual(r, {});
});
ava_1.default('Parse CLI env: Invalid Array', t => {
    const r = EnvParser_1.parseCliEnvFlags(['a', 'b', 'c']);
    t.deepEqual(r, {});
});
