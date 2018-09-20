import test from "ava";
import TypeScript from 'typescript';
import { parseTypescriptConfig } from "./TypescriptConfigParser";

test.only('Parse TypeScript Configuration: Error', t => {
    t.throws(() => {
        parseTypescriptConfig(process.cwd(), {
            compilerOptions: {
                alwaysStrict: true,
                skipLibCheck: true,
                noImplicitReturns: true,
                noFallthroughCasesInSwitch: true,
                allowSyntheticDefaultImports: true,

                target: "es5",
                module: "error",
                moduleResolution: "node"
            }
        });
    });
});

test.only('Parse TypeScript Configuration: OK', t => {
    let result = parseTypescriptConfig(process.cwd(), {
        "compilerOptions": {
            "noImplicitAny": false,
            "noImplicitThis": true,
            "alwaysStrict": true,
            "strictNullChecks": false,
            "strictFunctionTypes": false,
            "strictPropertyInitialization": false,
            "skipLibCheck": true,

            "noUnusedLocals": false,
            "noUnusedParameters": false,
            "noImplicitReturns": true,
            "noFallthroughCasesInSwitch": true,

            "experimentalDecorators": true,
            "allowSyntheticDefaultImports": true,
            "resolveJsonModule": true,

            "noEmit": true,
            "target": "es5",
            "module": "esnext",
            "moduleResolution": "node",
            "importHelpers": true,
            "jsx": "react",

            "lib": [
                "dom",
                "es5",
                "es2015.core",
                "es2015.promise",
                "es2015.collection",
                "es2015.reflect",
                "es2016.array.include",
                "es2017.string",
                "es2017.object",
                "es2017.typedarrays",
                "es2018.promise"
            ]
        },
        "exclude": [
            "node_modules"
        ]
    });

    t.true(result.options.alwaysStrict === true
        && result.options.skipLibCheck === true
        && result.options.noImplicitReturns === true
        && result.options.noFallthroughCasesInSwitch === true
        && result.options.noEmit === true
        && result.options.target === TypeScript.ScriptTarget.ES5
        && result.options.module === TypeScript.ModuleKind.ESNext
        && result.options.moduleResolution === TypeScript.ModuleResolutionKind.NodeJs
        && result.options.importHelpers === true
        && result.options.jsx === TypeScript.JsxEmit.React);
});
