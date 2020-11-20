"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack = require("webpack");
const memoryFS = require("memory-fs");
const path = require("path");
const TypescriptConfigParser_1 = require("../TypescriptConfigParser");
const ava_1 = require("ava");
const LoaderPaths_1 = require("./LoaderPaths");
const root = process.cwd();
const fixtures = path.join(root, 'fixtures', 'CoreTypeScriptLoader');
const tsconfigJson = {
    compilerOptions: {
        "target": "ES5",
        "module": "ESNext",
        "strict": true,
        "noImplicitAny": false,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "moduleResolution": "node",
        "allowSyntheticDefaultImports": true,
        "forceConsistentCasingInFileNames": true,
        "skipLibCheck": true,
    }
};
const tsconfig = TypescriptConfigParser_1.parseTypescriptConfig(fixtures, tsconfigJson);
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
                    test: /\.tsx?$/,
                    use: [{
                            loader: LoaderPaths_1.LoaderPaths.typescript,
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
    return await new Promise((ok, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                reject(err);
            }
            ok(stats);
        });
    });
}
ava_1.default('Core TypeScript Loader: ES5', async (t) => {
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
        let result = o.modules.filter(Q => Q.name === './index.ts')[0].source;
        if (result) {
            result = result.replace(/\r/g, '');
        }
        t.is(result, '"use strict";\nvar foo = function (bar) {\n    return bar.length;\n};\nvar x = foo(\'abcd\');\n');
    }
    else {
        t.fail('webpack stats.toJson().modules is undefined!');
    }
});
