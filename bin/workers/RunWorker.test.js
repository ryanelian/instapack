"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const source_map_1 = require("source-map");
const RunWorker_1 = require("./RunWorker");
ava_1.default('Run Minify Worker Async', (t) => __awaiter(this, void 0, void 0, function* () {
    let hellojs = `function hello(world) {
    return world + 1;
}
`;
    let foojs = `function foo(bar) {
    return bar * 2;
}
`;
    let concat = hellojs + '\n' + foojs;
    let smgen = new source_map_1.SourceMapGenerator();
    smgen.addMapping({
        source: 'hello.js',
        original: {
            column: 0,
            line: 1
        },
        generated: {
            column: 0,
            line: 1
        }
    });
    smgen.addMapping({
        source: 'foo.js',
        original: {
            column: 0,
            line: 1
        },
        generated: {
            column: 0,
            line: 5
        }
    });
    smgen.setSourceContent('hello.js', hellojs);
    smgen.setSourceContent('foo.js', foojs);
    let input = {
        code: concat,
        fileName: 'test.js',
        map: smgen.toJSON()
    };
    let result = yield RunWorker_1.runMinifyWorker(input);
    let minifed = (typeof result.code === 'string') && (result.code.length < input.code.length);
    let rawSM = JSON.parse(result.map);
    let mapped = Boolean(rawSM.version === 3
        && Array.isArray(rawSM.sources)
        && typeof rawSM.mappings === 'string'
        && rawSM.sources.includes('hello.js') && rawSM.sources.includes('foo.js'));
    t.true(minifed && mapped);
}));
