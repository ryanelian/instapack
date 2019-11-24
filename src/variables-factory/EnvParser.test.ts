import test from 'ava';
import * as upath from 'upath';
import { readDotEnvFrom, parseCliEnvFlags } from './EnvParser';

const root = process.cwd();
const fixtures = upath.join(root, 'fixtures');

test('Read .env File: Valid', async t => {
    const folder = upath.join(fixtures, 'DotEnvValid');
    const r = await readDotEnvFrom(folder);
    t.deepEqual(r, {
        foo: 'undefined',
        bar: 'null',
        magic: 'true',
        x: '777',
        nil: ''
    });
});

test('Read .env File: Invalid', async t => {
    const folder = upath.join(fixtures, 'DotEnvInvalid');
    const r = await readDotEnvFrom(folder);
    t.deepEqual(r, {});
});

test('Read .env File: Not Found', async t => {
    const folder = upath.join(fixtures, 'Empty');
    const r = await readDotEnvFrom(folder);

    t.deepEqual(r, {});
});

test('Parse CLI env: Valid', t => {
    const r = parseCliEnvFlags({
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
    const r = parseCliEnvFlags('true');
    t.deepEqual(r, {});
});

test('Parse CLI env: Invalid Boolean', t => {
    // --env
    const r = parseCliEnvFlags(true);
    t.deepEqual(r, {});
});

test('Parse CLI env: Invalid Number', t => {
    // --env=9999
    const r = parseCliEnvFlags(9999);
    t.deepEqual(r, {});
});

test('Parse CLI env: Invalid Array', t => {
    // --env=a --env=b --env=c
    const r = parseCliEnvFlags(['a', 'b', 'c']);
    t.deepEqual(r, {});
});
