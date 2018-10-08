"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const MergePackageJson_1 = require("./MergePackageJson");
ava_1.default('Object: Sort by Keys', t => {
    let x = {
        z: 123,
        a: 123
    };
    let y = MergePackageJson_1.objectSortByKeys(x);
    t.is(JSON.stringify(y), '{"a":123,"z":123}');
});
ava_1.default('Merge package.json', t => {
    let result = MergePackageJson_1.mergePackageJson({
        name: 'my-project',
        "instapack": {
            "input": "src"
        },
        dependencies: {
            vue: '1.0.0',
            linq: '1.0.0',
            lodash: '1.0.0'
        },
        devDependencies: {
            jquery: '1.0.0',
            gulp: '1.0.0',
            'babel-core': '1.0.0'
        }
    }, {
        "instapack": {
            "output": "wwwroot",
            "alias": {
                "vue": "vue/dist/vue.esm",
                "jquery": "jquery/dist/jquery.slim"
            }
        },
        dependencies: {
            jquery: '2.0.0',
            linq: '2.0.0',
            bootstrap: '3.0.0'
        },
        devDependencies: {
            vue: '2.0.0',
            'babel-core': '2.0.0',
            '@babel/preset-env': '1.0.0'
        }
    });
    t.deepEqual(result, {
        name: 'my-project',
        "instapack": {
            "output": "wwwroot",
            "alias": {
                "vue": "vue/dist/vue.esm",
                "jquery": "jquery/dist/jquery.slim"
            }
        },
        dependencies: {
            vue: '2.0.0',
            linq: '2.0.0',
            lodash: '1.0.0',
            bootstrap: '3.0.0'
        },
        devDependencies: {
            jquery: '2.0.0',
            gulp: '1.0.0',
            'babel-core': '2.0.0',
            '@babel/preset-env': '1.0.0'
        }
    });
});
