"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const TypescriptConfigParser_1 = require("./TypescriptConfigParser");
ava_1.default.only('Parse TypeScript Configuration: Error', t => {
    t.throws(() => {
        TypescriptConfigParser_1.parseTypescriptConfig(process.cwd(), {
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
