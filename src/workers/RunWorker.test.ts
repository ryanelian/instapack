import test from 'ava';
import { SourceMapGenerator, RawSourceMap } from 'source-map';
import { IMinifyWorkerInput } from './IMinifyWorkerInput';
import { runMinifyWorker } from './RunWorker';

test('Run Minify Worker Async', async t => {
    let hellojs = `function hello(world) {
    return world + 1;
}
`;

    let foojs = `function foo(bar) {
    return bar * 2;
}
`;

    let concat = hellojs + '\n' + foojs;

    let smgen = new SourceMapGenerator();
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

    // console.log(concat);

    let input: IMinifyWorkerInput = {
        code: concat,
        fileName: 'test.js',
        map: smgen.toJSON()
    };

    let result = await runMinifyWorker(input);

    let minifed = (typeof result.code === 'string') && (result.code.length < input.code.length);
    let rawSM: RawSourceMap = JSON.parse(result.map);
    let mapped = Boolean(rawSM.version === 3
        && Array.isArray(rawSM.sources)
        && typeof rawSM.mappings === 'string'
        && rawSM.sources.includes('hello.js') && rawSM.sources.includes('foo.js')
    );

    // console.log(result.map);
    t.true(minifed && mapped);
});
