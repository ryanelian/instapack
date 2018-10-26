import webpack = require('webpack');
import memoryFS = require('memory-fs');
import * as path from 'path';
import test from 'ava';
import { LoaderPaths } from './LoaderPaths';

let root = process.cwd();
let fixtures = path.join(root, 'fixtures', 'TemplateLoader');

async function compileAsync(entry: string) {
    let compiler = webpack({
        context: fixtures,
        entry: [entry],
        output: {
            filename: 'bundle.js',
            path: fixtures
        },
        module: {
            rules: [{
                test: /\.html?$/,
                use: [{
                    loader: LoaderPaths.template,
                }]
            }]
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs']
        },
        mode: 'development'
    });

    let ram = new memoryFS();
    compiler.outputFileSystem = ram;

    return await new Promise<webpack.Stats>((ok, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                reject(err);
            }

            ok(stats);
        });
    });
}

test('Template Loader: Simple HTML', async t => {
    let entry = path.join(fixtures, 'index.html');
    let stats = await compileAsync(entry);

    let o = stats.toJson();
    let result: string = o.modules.filter(Q => Q.source)[0].source;
    // t.log(o.modules);

    t.is(result, 'module.exports = "<div> <h1>Hello World!</h1> </div>"');
});
