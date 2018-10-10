import webpack = require('webpack');
import MemoryFileSystem = require('memory-fs');
import * as path from 'path';
import test from 'ava';
import { TypeScriptBuildMinifyPlugin } from './TypeScriptBuildMinifyPlugin';
import { Shout } from './Shout';

let root = process.cwd();
let fixtures = path.join(root, 'fixtures');

Shout.error = function () { };
Shout.warning = function () { };
Shout.timed = function () { };

async function compileAsync(folderName: string, ram: MemoryFileSystem) {
    let folder = path.join(fixtures, folderName);
    let entry = path.join(folder, 'index.js');

    let compiler = webpack({
        context: folder,
        entry: [entry],
        output: {
            filename: 'bundle.js',
            path: folder
        },
        mode: 'production',
        optimization: {
            minimizer: [new TypeScriptBuildMinifyPlugin()]
        }
    });

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

test('Build Minify Plugin: ES5', async t => {
    let ram = new MemoryFileSystem();
    let stats = await compileAsync('BuildMinifyPluginES5', ram);
    let o = stats.toJson();
    
    let outputPath = path.join(fixtures, 'BuildMinifyPluginES5', 'bundle.js');
    let output: string = ram.readFileSync(outputPath, 'utf8');

    // t.log(o);
    // t.log(output);
    let isMinified = output.includes('abc123') && output.includes('\n') === false;
    t.true(isMinified);
});

test('Build Minify Plugin: ES2015', async t => {
    let ram = new MemoryFileSystem();
    let stats = await compileAsync('BuildMinifyPluginES2015', ram);
    let o = stats.toJson();

    // t.log(o);
    let err = 'Unexpected token: keyword (const)';
    t.is(o.errors[0], err);
});
