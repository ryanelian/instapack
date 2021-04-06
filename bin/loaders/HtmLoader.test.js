"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack = require("webpack");
const memoryFS = require("memory-fs");
const path = require("path");
const ava_1 = require("ava");
const LoaderPaths_1 = require("./LoaderPaths");
const root = process.cwd();
const fixtures = path.join(root, 'fixtures', 'HtmLoader');
async function compileAsync(entry) {
    const compiler = webpack({
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
                            loader: LoaderPaths_1.LoaderPaths.html
                        }]
                }]
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx']
        },
        mode: 'development',
    });
    compiler.outputFileSystem = new memoryFS();
    return await new Promise((ok, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                reject(err);
            }
            ok(stats);
        });
    });
}
ava_1.default('HTML Loader', async (t) => {
    const entry = path.join(fixtures, 'index.ts');
    const stats = await compileAsync(entry);
    if (!stats) {
        t.fail('webpack stats is undefined!');
        return;
    }
    const o = stats.toJson({
        source: true,
        modules: true
    });
    if (o.modules) {
        let result = o.modules.filter(Q => Q.name === './test.html')[0].source;
        if (result && typeof result === 'string') {
            result = result.replace(/\r/g, '');
        }
        t.is(result, 'module.exports = "<span> Hello World! </span>"');
    }
    else {
        t.fail('webpack stats.toJson().modules is undefined!');
    }
});
