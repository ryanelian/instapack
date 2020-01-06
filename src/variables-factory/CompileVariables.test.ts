import test from "ava";

import { compileVariables } from "./CompileVariables";
import { BuildVariables } from "./BuildVariables";

test('Compile Variables: Simple', t => {
    const result = compileVariables(
        {
            env: {
                foo: 'bar'
            },
            serve: false,
            production: true,
            watch: false,
            sourceMap: true,
            stats: true,
            https: false,
            reactRefresh: false
        },
        {
            root: __dirname,
            input: 'client',
            output: 'wwwroot',
            jsOut: 'ipack.js',
            cssOut: 'ipack.css',

            alias: {},
            externals: {},
            namespace: 'instapack',
            copy: [],
            port1: 0
        },
        {
            mute: false,
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

    const expected: BuildVariables = {
        root: __dirname,
        input: 'client',
        output: 'wwwroot',
        jsOut: 'ipack.js',
        cssOut: 'ipack.css',

        alias: {},
        externals: {},
        namespace: 'instapack',
        copy: [],
        port1: 0,
        mute: true,
        packageManager: 'yarn',
        env: {
            foo: 'bar',
            hello: 'world'
        },
        serve: false,
        https: false,
        reactRefresh: true,
        production: true,
        watch: false,
        sourceMap: true,
        stats: true,
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
    const result = compileVariables(
        {
            env: {
                foo: 'bar',
            },
            serve: true,
            https: true,
            production: true,
            watch: false,
            sourceMap: false,
            stats: true,
            reactRefresh: true
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
            namespace: "instapack",
            copy: [{
                "library": "@fortawesome/fontawesome-free",
                "files": ["webfonts/**"],
                "destination": "webfonts"
            }],
            port1: 20178
        },
        {
            mute: true,
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

    const expected: BuildVariables = {
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
        namespace: "instapack",
        copy: [{
            "library": "@fortawesome/fontawesome-free",
            "files": ["webfonts/**"],
            "destination": "webfonts"
        }],
        port1: 20178,
        mute: true,
        packageManager: 'npm',
        env: {
            foo: 'bar'
        },
        serve: true,
        https: true,
        production: false,
        watch: true,
        sourceMap: false,
        stats: false,
        reactRefresh: true,
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
