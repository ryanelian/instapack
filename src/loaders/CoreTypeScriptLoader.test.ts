import webpack = require('webpack');
import memoryFS = require('memory-fs');
import * as path from 'path';
import { parseTypescriptConfig } from '../TypescriptConfigParser';
import test from 'ava';
import { LoaderPaths } from './LoaderPaths';

const root = process.cwd();
const fixtures = path.join(root, 'fixtures', 'CoreTypeScriptLoader');

const tsconfigJson = {
    compilerOptions: {
        "target": "ES5",                            /* Specify ECMAScript target version: 'ES3' (default), 'ES5', 'ES2015', 'ES2016', 'ES2017', 'ES2018', 'ES2019' or 'ESNEXT'. */
        "module": "ESNext",                         /* Specify module code generation: 'none', 'commonjs', 'amd', 'system', 'umd', 'es2015', or 'ESNext'. */

        "strict": true,                             /* Enable all strict type-checking options. */
        "noImplicitAny": false,                     /* Raise error on expressions and declarations with an implied 'any' type. */
        "noImplicitReturns": true,                  /* Report error when not all code paths in function return a value. */
        "noFallthroughCasesInSwitch": true,         /* Report errors for fallthrough cases in switch statement. */

        "moduleResolution": "node",                 /* Specify module resolution strategy: 'node' (Node.js) or 'classic' (TypeScript pre-1.6). */
        "allowSyntheticDefaultImports": true,       /* Allow default imports from modules with no default export. This does not affect code emit, just typechecking. */

        "forceConsistentCasingInFileNames": true,   /* Disallow inconsistently-cased references to the same file. */
        "skipLibCheck": true,                       /* Skip type checking of all declaration files. */
    }
};

const tsconfig = parseTypescriptConfig(fixtures, tsconfigJson);

async function compileAsync(entry: string): Promise<webpack.Stats> {
    const compiler = webpack({
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
            extensions: ['.ts', '.tsx', '.js', '.jsx']
        },
        mode: 'development',
    });

    compiler.outputFileSystem = new memoryFS();

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
    const entry = path.join(fixtures, 'index.ts');
    const stats = await compileAsync(entry);

    const o = stats.toJson({
        source: true,
        modules: true
    });
    // console.log(JSON.stringify(o, null, 4));
    if (o.modules) {
        let result = o.modules.filter(Q => Q.name === './index.ts')[0].source;
        if (result) {
            result = result.replace(/\r/g, '');
        }
        t.is(result, '"use strict";\nvar foo = function (bar) {\n    return bar.length;\n};\nvar x = foo(\'abcd\');\n');
    } else {
        t.fail('webpack stats.toJson().modules is undefined!')
    }
});
