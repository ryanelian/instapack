"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const LevelCheck_1 = require("./LevelCheck");
const typescript_1 = require("typescript");
ava_1.default('Level Check: ES2015 Function Parameters', t => {
    let check = LevelCheck_1.checkLevel('module.js', `function (a = 1, b = 2) { return a === 3 && b === 2; }`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Arrays', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var [a, , [b], c] = [5, null, [6]];`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Strings', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var [a, b, c] = "ab";`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Objects', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var {c, x:d, e} = {c:7, x:8};`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Primitives', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var {toFixed} = 2;
    var {slice} = '';`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Computed Props', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var qux = "corge";
    var { [qux]: grault } = { corge: "garply" };`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Multiple var', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var [a,b] = [5,6], {c,d} = {c:7,d:8};`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Nested', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var [e, {x:f, g}] = [9, {x:10}];
    var {h, x:[i]} = {h:11, x:[12]};`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - For In', t => {
    let check = LevelCheck_1.checkLevel('module.js', `for(var [i, j, k] in { qux: 1 }) {
        return i === "q" && j === "u" && k === "x";
      }`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Catch', t => {
    let check = LevelCheck_1.checkLevel('module.js', `try {
        throw [1,2];
      } catch([i,j]) {
      }`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Rest', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var [a, ...b] = [3, 4, 5];
    var [c, ...d] = [6];`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Defaults', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var {a = 1, b = 0, z:c = 3} = {b:2, z:undefined};
    var [d = 0, e = 5, f = 6] = [4,,undefined];`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Arrays', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var a,b,c;
    [a, , [b], c] = [5, null, [6]];`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Strings', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var a,b,c;
    [a, b, c] = "ab";`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Objects', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var c,d,e;
    ({c, x:d, e} = {c:7, x:8});`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Primitives', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var toFixed, slice;
    ({toFixed} = 2);
    ({slice} = '');`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Object Expression', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var a, b, obj = { a:1, b:2 };
    return ({a,b} = obj) === obj;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Chain Object', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var a,b,c,d;
    ({a,b} = {c,d} = {a:1,b:2,c:3,d:4});`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Computed Props', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var grault, qux = "corge";
    ({ [qux]: grault } = { corge: "garply" });`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Nested', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var e,f,g,h,i;
    [e, {x:f, g}] = [9, {x:10}];
    ({h, x:[i]} = {h:11, x:[12]});`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Rest', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var a,b,c,d;
    [a, ...b] = [3, 4, 5];
    [c, ...d] = [6];`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Nested Rest', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var a = [1, 2, 3], first, last;
    [first, ...[a[2], last]] = a;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Empty', t => {
    let check = LevelCheck_1.checkLevel('module.js', `[] = [1,2];
    ({} = {a:1,b:2});`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Defaults', t => {
    let check = LevelCheck_1.checkLevel('module.js', `var a,b,c,d,e,f;
    ({a = 1, b = 0, z:c = 3} = {b:2, z:undefined});
    [d = 0, e = 5, f = 6] = [4,,undefined];`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
