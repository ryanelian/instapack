"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const path_1 = __importDefault(require("path"));
const SassImportResolver_1 = require("./SassImportResolver");
let root = process.cwd();
let fixtures = path_1.default.join(root, 'fixtures', 'SassImport');
let source = path_1.default.join(fixtures, 'client', 'css', 'index.scss');
ava_1.default('Sass Import: Simple', (t) => __awaiter(this, void 0, void 0, function* () {
    let expected = path_1.default.join(fixtures, 'client', 'css', 'sass.scss');
    let result = yield SassImportResolver_1.sassImport(source, 'sass');
    t.is(result, expected);
}));
ava_1.default('Sass Import: Folder/index', (t) => __awaiter(this, void 0, void 0, function* () {
    let expected = path_1.default.join(fixtures, 'client', 'css', 'in-folder', 'index.scss');
    let result = yield SassImportResolver_1.sassImport(source, 'in-folder');
    t.is(result, expected);
}));
ava_1.default('Sass Import: Folder', (t) => __awaiter(this, void 0, void 0, function* () {
    let expected = path_1.default.join(fixtures, 'client', 'css', 'in-folder', 'test.scss');
    let result = yield SassImportResolver_1.sassImport(source, 'in-folder/test');
    t.is(result, expected);
}));
ava_1.default('Sass Import: npm/Library/index', (t) => __awaiter(this, void 0, void 0, function* () {
    let expected = path_1.default.join(fixtures, 'node_modules', 'in-npm', 'index.scss');
    let result = yield SassImportResolver_1.sassImport(source, 'in-npm');
    t.is(result, expected);
}));
ava_1.default('Sass Import: npm/Library/test', (t) => __awaiter(this, void 0, void 0, function* () {
    let expected = path_1.default.join(fixtures, 'node_modules', 'in-npm', 'test.scss');
    let result = yield SassImportResolver_1.sassImport(source, 'in-npm/test');
    t.is(result, expected);
}));
ava_1.default('Sass Import: _Partial', (t) => __awaiter(this, void 0, void 0, function* () {
    let expected = path_1.default.join(fixtures, 'client', 'css', '_partial.scss');
    let result = yield SassImportResolver_1.sassImport(source, 'partial');
    t.is(result, expected);
}));
ava_1.default('Sass Import: Folder/_index', (t) => __awaiter(this, void 0, void 0, function* () {
    let expected = path_1.default.join(fixtures, 'client', 'css', 'partial-in-folder', '_index.scss');
    let result = yield SassImportResolver_1.sassImport(source, 'partial-in-folder');
    t.is(result, expected);
}));
ava_1.default('Sass Import: Folder/_Partial', (t) => __awaiter(this, void 0, void 0, function* () {
    let expected = path_1.default.join(fixtures, 'client', 'css', 'partial-in-folder', '_test.scss');
    let result = yield SassImportResolver_1.sassImport(source, 'partial-in-folder/test');
    t.is(result, expected);
}));
ava_1.default('Sass Import: _Partial.scss', (t) => __awaiter(this, void 0, void 0, function* () {
    let expected = path_1.default.join(fixtures, 'client', 'css', '_partial.scss');
    let result = yield SassImportResolver_1.sassImport(source, '_partial.scss');
    t.is(result, expected);
}));
ava_1.default('Sass Import: _Folder/_index', (t) => __awaiter(this, void 0, void 0, function* () {
    let expected = path_1.default.join(fixtures, 'client', 'css', '_in-folder', '_index.scss');
    let result = yield SassImportResolver_1.sassImport(source, '_in-folder');
    t.is(result, expected);
}));
ava_1.default('Sass Import: npm/Library/_index', (t) => __awaiter(this, void 0, void 0, function* () {
    let expected = path_1.default.join(fixtures, 'node_modules', 'partial-in-npm', '_index.scss');
    let result = yield SassImportResolver_1.sassImport(source, 'partial-in-npm');
    t.is(result, expected);
}));
ava_1.default('Sass Import: npm/Library/_Partial', (t) => __awaiter(this, void 0, void 0, function* () {
    let expected = path_1.default.join(fixtures, 'node_modules', 'partial-in-npm', '_test.scss');
    let result = yield SassImportResolver_1.sassImport(source, 'partial-in-npm/test');
    t.is(result, expected);
}));
ava_1.default('CSS Import: Simple', (t) => __awaiter(this, void 0, void 0, function* () {
    let expected = path_1.default.join(fixtures, 'client', 'css', 'test.css');
    let result = yield SassImportResolver_1.sassImport(source, 'test');
    t.is(result, expected);
}));
ava_1.default('CSS Import: Folder/index', (t) => __awaiter(this, void 0, void 0, function* () {
    let expected = path_1.default.join(fixtures, 'client', 'css', 'css-in-folder', 'index.css');
    let result = yield SassImportResolver_1.sassImport(source, 'css-in-folder');
    t.is(result, expected);
}));
ava_1.default('CSS Import: Folder', (t) => __awaiter(this, void 0, void 0, function* () {
    let expected = path_1.default.join(fixtures, 'client', 'css', 'css-in-folder', 'test.css');
    let result = yield SassImportResolver_1.sassImport(source, 'css-in-folder/test');
    t.is(result, expected);
}));
ava_1.default('Sass Import Error: npm/_Partial.scss OR _Partial/index OR Folder/_index.css', (t) => __awaiter(this, void 0, void 0, function* () {
    yield t.throwsAsync(SassImportResolver_1.sassImport(source, 'should-fail'));
}));
