"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const upath = require("upath");
const EnvParser_1 = require("./EnvParser");
const root = process.cwd();
const fixtures = upath.join(root, 'fixtures');
ava_1.default('Read .env File: Valid', async (t) => {
    const folder = upath.join(fixtures, 'DotEnvValid');
    const r = await EnvParser_1.readDotEnvFrom(folder);
    t.deepEqual(r, {
        foo: 'undefined',
        bar: 'null',
        magic: 'true',
        x: '777',
        nil: ''
    });
});
ava_1.default('Read .env File: Invalid', async (t) => {
    const folder = upath.join(fixtures, 'DotEnvInvalid');
    const r = await EnvParser_1.readDotEnvFrom(folder);
    t.deepEqual(r, {});
});
ava_1.default('Read .env File: Not Found', async (t) => {
    const folder = upath.join(fixtures, 'Empty');
    const r = await EnvParser_1.readDotEnvFrom(folder);
    t.deepEqual(r, {});
});
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
