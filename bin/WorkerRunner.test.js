"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const WorkerRunner_1 = require("./WorkerRunner");
ava_1.default('Run Minify Worker Async', (t) => __awaiter(this, void 0, void 0, function* () {
    let input = {
        code: `
function foo(bar) {
    return bar * 2;
}`,
        fileName: 'test.js'
    };
    let result = yield WorkerRunner_1.runMinifyWorkerAsync(input);
    t.true(result.code.length < input.code.length);
}));
