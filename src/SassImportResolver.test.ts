import test from "ava";
import path from 'path';
import { sassImport } from "./SassImportResolver";

let root = process.cwd();
let fixtures = path.join(root, 'fixtures', 'SassImport');
let source = path.join(fixtures, 'client', 'css', 'index.scss');

test('Sass Import: Simple', async t => {
    let expected = path.join(fixtures, 'client', 'css', 'sass.scss');
    let result = await sassImport(source, 'sass');

    t.is(result, expected);
});

test('Sass Import: Folder/index', async t => {
    let expected = path.join(fixtures, 'client', 'css', 'in-folder', 'index.scss');
    let result = await sassImport(source, 'in-folder');

    t.is(result, expected);
});

test('Sass Import: Folder', async t => {
    let expected = path.join(fixtures, 'client', 'css', 'in-folder', 'test.scss');
    let result = await sassImport(source, 'in-folder/test');

    t.is(result, expected);
});

test('Sass Import: npm/Library/index', async t => {
    let expected = path.join(fixtures, 'node_modules', 'in-npm', 'index.scss');
    let result = await sassImport(source, 'in-npm');

    t.is(result, expected);
});

test('Sass Import: npm/Library/test', async t => {
    let expected = path.join(fixtures, 'node_modules', 'in-npm', 'test.scss');
    let result = await sassImport(source, 'in-npm/test');

    t.is(result, expected);
});

test('Sass Import: _Partial', async t => {
    let expected = path.join(fixtures, 'client', 'css', '_partial.scss');
    let result = await sassImport(source, 'partial');

    t.is(result, expected);
});

test('Sass Import: Folder/_index', async t => {
    let expected = path.join(fixtures, 'client', 'css', 'partial-in-folder', '_index.scss');
    let result = await sassImport(source, 'partial-in-folder');

    t.is(result, expected);
});

test('Sass Import: Folder/_Partial', async t => {
    let expected = path.join(fixtures, 'client', 'css', 'partial-in-folder', '_test.scss');
    let result = await sassImport(source, 'partial-in-folder/test');

    t.is(result, expected);
});

test('Sass Import: npm/Library/_index', async t => {
    let expected = path.join(fixtures, 'node_modules', 'partial-in-npm', '_index.scss');
    let result = await sassImport(source, 'partial-in-npm');

    t.is(result, expected);
});

test('Sass Import: npm/Library/_Partial', async t => {
    let expected = path.join(fixtures, 'node_modules', 'partial-in-npm', '_test.scss');
    let result = await sassImport(source, 'partial-in-npm/test');

    t.is(result, expected);
});

test('Sass Import Error: npm/_Partial.scss OR _Partial/index', async t => {
    await t.throwsAsync(sassImport(source, 'should-fail'));
});
