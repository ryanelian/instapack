"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const CompileVariables_1 = require("./CompileVariables");
ava_1.default('Compile Variables: Simple', t => {
    const result = CompileVariables_1.compileVariables({
        env: {
            foo: 'bar'
        },
        hot: false,
        production: true,
        watch: false,
        sourceMap: true,
        stats: true,
        verbose: false
    }, {
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
    }, {
        silent: false,
        packageManager: 'yarn'
    }, {
        hello: 'world'
    }, {
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
    const expected = {
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
        silent: true,
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
    };
    t.deepEqual(result, expected);
});
ava_1.default('Compile Variables: Overrides', t => {
    const result = CompileVariables_1.compileVariables({
        env: {
            foo: 'bar',
        },
        hot: true,
        production: true,
        watch: false,
        sourceMap: false,
        stats: true,
        verbose: true
    }, {
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
    }, {
        silent: true,
        packageManager: 'npm'
    }, {
        foo: 'zero'
    }, {
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
    const expected = {
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
        silent: true,
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
    };
    t.deepEqual(result, expected);
});
