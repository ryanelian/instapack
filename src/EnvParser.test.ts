import test from 'ava';
import upath from 'upath';
import { readDotEnvFrom, parseCliEnvFlags } from './EnvParser';

let root = process.cwd();
let fixtures = upath.join(root, 'fixtures');

test('Read .env File: Valid', async t => {
    let folder = upath.join(fixtures, 'DotEnvValid');
    let r = await readDotEnvFrom(folder);
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
    let r = await readDotEnvFrom(folder);
    t.deepEqual(r, {});
});

test('Read .env File: Not Found', async t => {
    let folder = upath.join(fixtures, 'Empty');
    let r = await readDotEnvFrom(folder);

    t.deepEqual(r, {});
});

test('Parse CLI env: Valid', t => {
    let r = parseCliEnvFlags({
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
    let r = parseCliEnvFlags('true');
    t.deepEqual(r, {});
});

test('Parse CLI env: Invalid Boolean', t => {
    // --env
    let r = parseCliEnvFlags(true);
    t.deepEqual(r, {});
});

test('Parse CLI env: Invalid Number', t => {
    // --env=9999
    let r = parseCliEnvFlags(9999);
    t.deepEqual(r, {});
});

test('Parse CLI env: Invalid Array', t => {
    // --env=a --env=b --env=c
    let r = parseCliEnvFlags(['a', 'b', 'c']);
    t.deepEqual(r, {});
});
