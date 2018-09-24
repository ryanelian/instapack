import test from "ava";
import * as path from 'path';
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

test('Sass Import: _Partial.scss', async t => {
    let expected = path.join(fixtures, 'client', 'css', '_partial.scss');
    let result = await sassImport(source, '_partial.scss');

    // Ensures type-2 resolver is being used for queries starting with _
    t.is(result, expected);
});

test('Sass Import: _Folder/_index', async t => {
    let expected = path.join(fixtures, 'client', 'css', '_in-folder', '_index.scss');
    let result = await sassImport(source, '_in-folder');

    // Ensures type-2 resolver is being used for queries starting with _
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

test('CSS Import: Simple', async t => {
    let expected = path.join(fixtures, 'client', 'css', 'test.css');
    let result = await sassImport(source, 'test');

    t.is(result, expected);
});

test('CSS Import: Folder/index', async t => {
    let expected = path.join(fixtures, 'client', 'css', 'css-in-folder', 'index.css');
    let result = await sassImport(source, 'css-in-folder');

    t.is(result, expected);
});

test('CSS Import: Folder', async t => {
    let expected = path.join(fixtures, 'client', 'css', 'css-in-folder', 'test.css');
    let result = await sassImport(source, 'css-in-folder/test');

    t.is(result, expected);
});

test('CSS Import: npm package.json:style', async t => {
    let expected = path.join(fixtures, 'node_modules', 'lib', 'dist', 'index.css');
    let result = await sassImport(source, 'lib');

    t.is(result, expected);
});

test('CSS Import: npm/dist/index.css', async t => {
    let expected = path.join(fixtures, 'node_modules', 'lib', 'dist', 'index.css');
    let result = await sassImport(source, 'lib/dist');

    t.is(result, expected);
});

test('CSS Import: npm/dist/test.css', async t => {
    let expected = path.join(fixtures, 'node_modules', 'lib', 'dist', 'test.css');
    let result = await sassImport(source, 'lib/dist/test');

    t.is(result, expected);
});

test('Sass Import Error', async t => {
    // npm/_Partial.scss
    // _Partial/index.scss
    // _Partial/_index.scss
    // Folder/_index.css
    await t.throwsAsync(sassImport(source, 'should-fail'));
});
