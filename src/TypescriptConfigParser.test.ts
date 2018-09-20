import test from "ava";
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
