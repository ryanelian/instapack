import test from 'ava';
import { runMinifyWorkerAsync } from './WorkerRunner';
import { IMinifyInputs } from './interfaces/IMinifyInputs';

test('Run Minify Worker Async', async t => {
    let input: IMinifyInputs = {
        code: `
function foo(bar) {
    return bar * 2;
}`,
        fileName: 'test.js'
    };

    let result = await runMinifyWorkerAsync(input);

    t.true(result.code.length < input.code.length);
});
