import test from "ava";

import { compileVariables } from "./CompileVariables";
import { IVariables } from "./IVariables";

test('Compile Variables: Simple', t => {
    let result = compileVariables(
        {
            env: {
                foo: 'bar'
            },
            hot: false,
            production: true,
            watch: false,
            sourceMap: true,
            stats: true,
            verbose: false
        },
        {
            root: __dirname,
            input: 'client',
            output: 'wwwroot',
            jsOut: 'ipack.js',
            cssOut: 'ipack.css',

            alias: {},
            externals: {},
            port1: 0,
            port2: 0
        },
        {
            muteNotification: false,
            packageManager: 'yarn'
        },
        {
            hello: 'world'
        },
        {
            compilerOptions: {
                alwaysStrict: true,
                skipLibCheck: true,
                noImplicitReturns: true,
                noFallthroughCasesInSwitch: true,
                allowSyntheticDefaultImports: true,

                target: "es5",
                module: "esnext",
                moduleResolution: "node"
            }
        });

    let expected: IVariables = {
        root: __dirname,
        input: 'client',
        output: 'wwwroot',
        jsOut: 'ipack.js',
        cssOut: 'ipack.css',

        alias: {},
        externals: {},
        port1: 0,
        port2: 0,
        muteNotification: false,
        packageManager: 'yarn',
        env: {
            foo: 'bar',
            hello: 'world'
        },
        hot: false,
        production: true,
        watch: false,
        sourceMap: true,
        stats: true,
        verbose: false,
        typescriptConfiguration: {
            compilerOptions: {
                alwaysStrict: true,
                skipLibCheck: true,
                noImplicitReturns: true,
                noFallthroughCasesInSwitch: true,
                allowSyntheticDefaultImports: true,

                target: "es5",
                module: "esnext",
                moduleResolution: "node"
            }
        }
    }

    t.deepEqual(result, expected);
});

test('Compile Variables: Overrides', t => {
    let result = compileVariables(
        {
            env: {
                foo: 'bar',
            },
            hot: true,
            production: true,
            watch: false,
            sourceMap: false,
            stats: true,
            verbose: true
        },
        {
            root: __dirname,
            input: 'src',
            output: 'www',
            jsOut: 'bundle.js',
            cssOut: 'bundle.css',

            alias: {
                'vue': 'vue/dist/vue.esm'
            },
            externals: {
                jquery: '$'
            },
            port1: 20178,
            port2: 20179
        },
        {
            muteNotification: true,
            packageManager: 'npm'
        },
        {
            foo: 'zero'
        },
        {
            compilerOptions: {
                alwaysStrict: true,
                skipLibCheck: true,
                noImplicitReturns: true,
                noFallthroughCasesInSwitch: true,
                allowSyntheticDefaultImports: true,

                target: "es5",
                module: "esnext",
                moduleResolution: "node"
            }
        });

    let expected: IVariables = {
        root: __dirname,
        input: 'src',
        output: 'www',
        jsOut: 'bundle.js',
        cssOut: 'bundle.css',

        alias: {
            'vue': 'vue/dist/vue.esm'
        },
        externals: {
            jquery: '$'
        },
        port1: 20178,
        port2: 20179,
        muteNotification: true,
        packageManager: 'npm',
        env: {
            foo: 'bar'
        },
        hot: true,
        production: false,
        watch: true,
        sourceMap: false,
        stats: false,
        verbose: true,
        typescriptConfiguration: {
            compilerOptions: {
                alwaysStrict: true,
                skipLibCheck: true,
                noImplicitReturns: true,
                noFallthroughCasesInSwitch: true,
                allowSyntheticDefaultImports: true,

                target: "es5",
                module: "esnext",
                moduleResolution: "node"
            }
        }
    }

    t.deepEqual(result, expected);
});
