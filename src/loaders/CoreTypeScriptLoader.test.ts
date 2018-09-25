import webpack = require('webpack');
import memoryFS = require('memory-fs');
import * as path from 'path';
import { parseTypescriptConfig } from '../TypescriptConfigParser';
import test from 'ava';
import { LoaderPaths } from './LoaderPaths';

let root = process.cwd();
let fixtures = path.join(root, 'fixtures', 'CoreTypeScriptLoader');

let tsconfigJson = {
    compilerOptions: {
        alwaysStrict: true,
        skipLibCheck: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,

        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        jsx: "react",

        target: "es5",
        module: "esnext",
        moduleResolution: "node",

        lib: [
            "dom",
            "es5",
            "es2015.core",
            "es2015.promise"
        ]
    }
};

let tsconfig = parseTypescriptConfig(fixtures, tsconfigJson);

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
                test: /\.tsx?$/,
                use: [{
                    loader: LoaderPaths.typescript,
                    options: {
                        compilerOptions: tsconfig.options
                    }
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

test('Core TypeScript Loader: ES5', async t => {
    let entry = path.join(fixtures, 'index.ts');
    let stats = await compileAsync(entry);

    let o = stats.toJson();
    let result = o.modules[0].source;

    t.is(result, '"use strict";\r\nvar foo = function (bar) {\r\n    return bar.length;\r\n};\r\nvar x = foo(\'abcd\');\r\n');
});
