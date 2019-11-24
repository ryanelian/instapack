import test from "ava";
import * as path from 'path';
import { sassImport } from "./SassImportResolver";

const root = process.cwd();
const fixtures = path.join(root, 'fixtures', 'SassImport');
const source = path.join(fixtures, 'client', 'css', 'index.scss');

test('Sass Import: Simple', async t => {
    const expected = path.join(fixtures, 'client', 'css', 'sass.scss');
    const result = await sassImport(source, 'sass');

    t.is(result, expected);
});

test('Sass Import: Folder/index', async t => {
    const expected = path.join(fixtures, 'client', 'css', 'in-folder', 'index.scss');
    const result = await sassImport(source, 'in-folder');

    t.is(result, expected);
});

test('Sass Import: Folder', async t => {
    const expected = path.join(fixtures, 'client', 'css', 'in-folder', 'test.scss');
    const result = await sassImport(source, 'in-folder/test');

    t.is(result, expected);
});

test('Sass Import: npm/Library/index', async t => {
    const expected = path.join(fixtures, 'node_modules', 'in-npm', 'index.scss');
    const result = await sassImport(source, 'in-npm');

    t.is(result, expected);
});

test('Sass Import: npm/Library/test', async t => {
    const expected = path.join(fixtures, 'node_modules', 'in-npm', 'test.scss');
    const result = await sassImport(source, 'in-npm/test');

    t.is(result, expected);
});

test('Sass Import: _Partial', async t => {
    const expected = path.join(fixtures, 'client', 'css', '_partial.scss');
    const result = await sassImport(source, 'partial');

    t.is(result, expected);
});

test('Sass Import: Folder/_index', async t => {
    const expected = path.join(fixtures, 'client', 'css', 'partial-in-folder', '_index.scss');
    const result = await sassImport(source, 'partial-in-folder');

    t.is(result, expected);
});

test('Sass Import: Folder/_Partial', async t => {
    const expected = path.join(fixtures, 'client', 'css', 'partial-in-folder', '_test.scss');
    const result = await sassImport(source, 'partial-in-folder/test');

    t.is(result, expected);
});

test('Sass Import: _Partial.scss', async t => {
    const expected = path.join(fixtures, 'client', 'css', '_partial.scss');
    const result = await sassImport(source, '_partial.scss');

    // Ensures type-2 resolver is being used for queries starting with _
    t.is(result, expected);
});

test('Sass Import: _Folder/_index', async t => {
    const expected = path.join(fixtures, 'client', 'css', '_in-folder', '_index.scss');
    const result = await sassImport(source, '_in-folder');

    // Ensures type-2 resolver is being used for queries starting with _
    t.is(result, expected);
});

test('Sass Import: npm/Library/_index', async t => {
    const expected = path.join(fixtures, 'node_modules', 'partial-in-npm', '_index.scss');
    const result = await sassImport(source, 'partial-in-npm');

    t.is(result, expected);
});

test('Sass Import: npm/Library/_Partial', async t => {
    const expected = path.join(fixtures, 'node_modules', 'partial-in-npm', '_test.scss');
    const result = await sassImport(source, 'partial-in-npm/test');

    t.is(result, expected);
});

test('CSS Import: Simple', async t => {
    const expected = path.join(fixtures, 'client', 'css', 'test.css');
    const result = await sassImport(source, 'test');

    t.is(result, expected);
});

test('CSS Import: Folder/index', async t => {
    const expected = path.join(fixtures, 'client', 'css', 'css-in-folder', 'index.css');
    const result = await sassImport(source, 'css-in-folder');

    t.is(result, expected);
});

test('CSS Import: Folder', async t => {
    const expected = path.join(fixtures, 'client', 'css', 'css-in-folder', 'test.css');
    const result = await sassImport(source, 'css-in-folder/test');

    t.is(result, expected);
});

test('CSS Import: npm package.json:style', async t => {
    const expected = path.join(fixtures, 'node_modules', 'lib', 'dist', 'index.css');
    const result = await sassImport(source, 'lib');

    t.is(result, expected);
});

test('CSS Import: npm/dist/index.css', async t => {
    const expected = path.join(fixtures, 'node_modules', 'lib', 'dist', 'index.css');
    const result = await sassImport(source, 'lib/dist');

    t.is(result, expected);
});

test('CSS Import: npm/dist/test.css', async t => {
    const expected = path.join(fixtures, 'node_modules', 'lib', 'dist', 'test.css');
    const result = await sassImport(source, 'lib/dist/test');

    t.is(result, expected);
});

test('Sass Import Error', async t => {
    // npm/_Partial.scss
    // _Partial/index.scss
    // _Partial/_index.scss
    // Folder/_index.css
    await t.throwsAsync(sassImport(source, 'should-fail'));
});
