"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const path = require("path");
const SassImportResolver_1 = require("./SassImportResolver");
const root = process.cwd();
const fixtures = path.join(root, 'fixtures', 'SassImport');
const source = path.join(fixtures, 'client', 'css', 'index.scss');
ava_1.default('Sass Import: Simple', t => {
    const expected = path.join(fixtures, 'client', 'css', 'sass.scss');
    const result = SassImportResolver_1.sassImport(source, 'sass');
    t.is(result, expected);
});
ava_1.default('Sass Import: Folder/index', t => {
    const expected = path.join(fixtures, 'client', 'css', 'in-folder', 'index.scss');
    const result = SassImportResolver_1.sassImport(source, 'in-folder');
    t.is(result, expected);
});
ava_1.default('Sass Import: Folder', t => {
    const expected = path.join(fixtures, 'client', 'css', 'in-folder', 'test.scss');
    const result = SassImportResolver_1.sassImport(source, 'in-folder/test');
    t.is(result, expected);
});
ava_1.default('Sass Import: npm/Library/index', t => {
    const expected = path.join(fixtures, 'node_modules', 'in-npm', 'index.scss');
    const result = SassImportResolver_1.sassImport(source, 'in-npm');
    t.is(result, expected);
});
ava_1.default('Sass Import: npm/Library/test', t => {
    const expected = path.join(fixtures, 'node_modules', 'in-npm', 'test.scss');
    const result = SassImportResolver_1.sassImport(source, 'in-npm/test');
    t.is(result, expected);
});
ava_1.default('Sass Import: _Partial', t => {
    const expected = path.join(fixtures, 'client', 'css', '_partial.scss');
    const result = SassImportResolver_1.sassImport(source, 'partial');
    t.is(result, expected);
});
ava_1.default('Sass Import: Folder/_index', t => {
    const expected = path.join(fixtures, 'client', 'css', 'partial-in-folder', '_index.scss');
    const result = SassImportResolver_1.sassImport(source, 'partial-in-folder');
    t.is(result, expected);
});
ava_1.default('Sass Import: Folder/_Partial', t => {
    const expected = path.join(fixtures, 'client', 'css', 'partial-in-folder', '_test.scss');
    const result = SassImportResolver_1.sassImport(source, 'partial-in-folder/test');
    t.is(result, expected);
});
ava_1.default('Sass Import: _Partial.scss', t => {
    const expected = path.join(fixtures, 'client', 'css', '_partial.scss');
    const result = SassImportResolver_1.sassImport(source, '_partial.scss');
    t.is(result, expected);
});
ava_1.default('Sass Import: _Folder/_index', t => {
    const expected = path.join(fixtures, 'client', 'css', '_in-folder', '_index.scss');
    const result = SassImportResolver_1.sassImport(source, '_in-folder');
    t.is(result, expected);
});
ava_1.default('Sass Import: npm/Library/_index', t => {
    const expected = path.join(fixtures, 'node_modules', 'partial-in-npm', '_index.scss');
    const result = SassImportResolver_1.sassImport(source, 'partial-in-npm');
    t.is(result, expected);
});
ava_1.default('Sass Import: npm/Library/_Partial', t => {
    const expected = path.join(fixtures, 'node_modules', 'partial-in-npm', '_test.scss');
    const result = SassImportResolver_1.sassImport(source, 'partial-in-npm/test');
    t.is(result, expected);
});
ava_1.default('CSS Import: Simple', t => {
    const expected = path.join(fixtures, 'client', 'css', 'test.css');
    const result = SassImportResolver_1.sassImport(source, 'test');
    t.is(result, expected);
});
ava_1.default('CSS Import: Folder/index', t => {
    const expected = path.join(fixtures, 'client', 'css', 'css-in-folder', 'index.css');
    const result = SassImportResolver_1.sassImport(source, 'css-in-folder');
    t.is(result, expected);
});
ava_1.default('CSS Import: Folder', t => {
    const expected = path.join(fixtures, 'client', 'css', 'css-in-folder', 'test.css');
    const result = SassImportResolver_1.sassImport(source, 'css-in-folder/test');
    t.is(result, expected);
});
ava_1.default('CSS Import: npm package.json:style', t => {
    const expected = path.join(fixtures, 'node_modules', 'lib', 'dist', 'index.css');
    const result = SassImportResolver_1.sassImport(source, 'lib');
    t.is(result, expected);
});
ava_1.default('CSS Import: npm/dist/index.css', t => {
    const expected = path.join(fixtures, 'node_modules', 'lib', 'dist', 'index.css');
    const result = SassImportResolver_1.sassImport(source, 'lib/dist');
    t.is(result, expected);
});
ava_1.default('CSS Import: npm/dist/test.css', t => {
    const expected = path.join(fixtures, 'node_modules', 'lib', 'dist', 'test.css');
    const result = SassImportResolver_1.sassImport(source, 'lib/dist/test');
    t.is(result, expected);
});
ava_1.default('Sass Import Error', t => {
    t.throws(() => {
        SassImportResolver_1.sassImport(source, 'should-fail');
    });
});
