"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const fse = require("fs-extra");
const upath = require("upath");
const SyntaxLevelChecker_1 = require("./SyntaxLevelChecker");
const typescript_1 = require("typescript");
const root = process.cwd();
const samplesFolder = upath.join(root, 'fixtures', 'SyntaxLevelCheckSampleLibraries');
ava_1.default('Level Check: ES5 JQuery 3.4.1', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const fileName = 'jquery-3.4.1.min.js';
    const filePath = upath.join(samplesFolder, fileName);
    const sourceCode = yield fse.readFile(filePath, 'utf8');
    const check = SyntaxLevelChecker_1.checkSyntaxLevel(fileName, sourceCode, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES5);
}));
ava_1.default('Level Check: ES5 AngularJS 1.2.32', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const fileName = 'angular-1.2.32.min.js';
    const filePath = upath.join(samplesFolder, fileName);
    const sourceCode = yield fse.readFile(filePath, 'utf8');
    const check = SyntaxLevelChecker_1.checkSyntaxLevel(fileName, sourceCode, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES5);
}));
ava_1.default('Level Check: ES5 Bootstrap 3.3.7', (t) => __awaiter(void 0, void 0, void 0, function* () {
    const fileName = 'bootstrap-3.3.7.min.js';
    const filePath = upath.join(samplesFolder, fileName);
    const sourceCode = yield fse.readFile(filePath, 'utf8');
    const check = SyntaxLevelChecker_1.checkSyntaxLevel(fileName, sourceCode, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES5);
}));
ava_1.default('Level Check: ES2015 Function Parameters', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `function (a = 1, b = 2) { return a === 3 && b === 2; }`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Rest Parameters', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `return (function (foo, ...args) {}`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Spread Function Calls', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `Math.max(...[1, 2, 3])`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Spread Arrays', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `[...[1, 2, 3]]`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Spread Strings', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `Math.max(..."1234")`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Spread Strings in Arrays', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `["a", ..."bcd", "e"]`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Computed Properties', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var x = 'y';
    return ({ [x]: 1 }).y === 1;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Shorthand Properties', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var a = 7, b = 8, c = {a,b};`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Shorthand Methods', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `({ y() { return 2; } })`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 String-Keyed Shorthand Methods', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `({ "foo bar"() { return 4; } })`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Computed Shorthand Methods', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var x = 'y';
    var o = { [x](){ return 1 } }`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Computed Accessors', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var x = 'y',
    obj = {
      get [x] () { return 1 },
      set [x] (value) { valueSet = value }
    };`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 for..of Arrays', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var arr = [5];
    for (var item of arr)
      return item === 5;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 for..of Strings', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var str = "";
    for (var item of "foo")
      str += item;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Octal Numeric Literal', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `return 0o10 === 8 && 0O10 === 8;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Binary Numeric Literal', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `return 0b10 === 2 && 0B10 === 2;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Template Literal', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', 'var a = "ba", b = "QUX"; return `foo bar ${a + "z"} ${b.toLowerCase()}` === "foo bar\nbaz qux";', typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Tagged Template Literal', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var called = false;
    function fn(parts, a, b) {
      called = true;
      return parts instanceof Array &&
        parts[0]     === "foo"      &&
        parts[1]     === "bar\n"    &&
        parts.raw[0] === "foo"      &&
        parts.raw[1] === "bar\\n"   &&
        a === 123                   &&
        b === 456;
    }
    ` + 'return fn `foo${123}bar\n${456}` && called;', typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Arrays', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var [a, , [b], c] = [5, null, [6]];`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Strings', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var [a, b, c] = "ab";`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Objects', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var {c, x:d, e} = {c:7, x:8};`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Primitives', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var {toFixed} = 2;
    var {slice} = '';`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Multiple var', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var [a,b] = [5,6], {c,d} = {c:7,d:8};`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Nested', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var [e, {x:f, g}] = [9, {x:10}];
    var {h, x:[i]} = {h:11, x:[12]};`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - for..in', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `for(var [i, j, k] in { qux: 1 }) {
        return i === "q" && j === "u" && k === "x";
      }`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - catch', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `try {
        throw [1,2];
      } catch([i,j]) {
      }`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Rest', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var [a, ...b] = [3, 4, 5];
    var [c, ...d] = [6];`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Declarations - Defaults', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var {a = 1, b = 0, z:c = 3} = {b:2, z:undefined};
    var [d = 0, e = 5, f = 6] = [4,,undefined];`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Arrays', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var a,b,c;
    [a, , [b], c] = [5, null, [6]];`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Strings', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var a,b,c;
    [a, b, c] = "ab";`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Objects', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var c,d,e;
    ({c, x:d, e} = {c:7, x:8});`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Primitives', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var toFixed, slice;
    ({toFixed} = 2);
    ({slice} = '');`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Object Expression', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var a, b, obj = { a:1, b:2 };
    return ({a,b} = obj) === obj;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Chain Object', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var a,b,c,d;
    ({a,b} = {c,d} = {a:1,b:2,c:3,d:4});`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Nested', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var e,f,g,h,i;
    [e, {x:f, g}] = [9, {x:10}];
    ({h, x:[i]} = {h:11, x:[12]});`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Rest', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var a,b,c,d;
    [a, ...b] = [3, 4, 5];
    [c, ...d] = [6];`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Nested Rest', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var a = [1, 2, 3], first, last;
    [first, ...[a[2], last]] = a;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Empty', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `[] = [1,2];
    ({} = {a:1,b:2});`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Assignment - Defaults', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var a,b,c,d,e,f;
    ({a = 1, b = 0, z:c = 3} = {b:2, z:undefined});
    [d = 0, e = 5, f = 6] = [4,,undefined];`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Parameters - Arrays', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `function([a, , [b], c]) {
        return a === 5 && b === 6 && c === undefined;
      }([5, null, [6]])`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Parameters - Strings', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `function([a, b, c]) {
        return a === "a" && b === "b" && c === undefined;
      }("ab")`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Parameters - Objects', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `function({c, x:d, e}) {
        return c === 7 && d === 8 && e === undefined;
      }({c:7, x:8});`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Parameters - Primitives', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `function({toFixed}, {slice}) {
        return toFixed === Number.prototype.toFixed
          && slice === String.prototype.slice;
      }(2,'')`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Parameters - Nested', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `function([e, {x:f, g}], {h, x:[i]}) {
        return e === 9 && f === 10 && g === undefined
          && h === 11 && i === 12;
      }([9, {x:10}],{h:11, x:[12]});`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Parameters - Rest', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `function([a, ...b], [c, ...d]) {
        return a === 3 && b instanceof Array && (b + "") === "4,5" &&
           c === 6 && d instanceof Array && d.length === 0;
      }([3, 4, 5], [6]);`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Parameters - Empty', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `function ([],{}){
        return arguments[0] + '' === "3,4" && arguments[1].x === "foo";
      }([3,4],{x:"foo"});`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Parameters - Defaults', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `(function({a = 1, b = 0, c = 3, x:d = 0, y:e = 5},
        [f = 6, g = 0, h = 8]) {
      return a === 1 && b === 2 && c === 3 && d === 4 &&
        e === 5 && f === 6 && g === 7 && h === 8;
    }({b:2, c:undefined, x:4},[, 7, undefined]));`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Destructuring Parameters - Defaults, Separate Scope', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `(function({a=function(){
        return typeof b === 'undefined';
      }}){
        var b = 1;
        return a();
      }({}));`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 new.target', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var passed = false;
    new function f() {
      passed = (new.target === f);
    }();`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 let', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `let foo = 123;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 const', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `const foo = 123;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Arrow Functions - 0 parameters', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `(() => 5)`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Arrow Functions - 1 parameter, no brackets', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var b = x => x + "foo";`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Arrow Functions - Multiple Parameters', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var c = (v, w, x, y, z) => "" + v + w + x + y + z;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Class', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `
class Rectangle extends Shape {
    constructor(height, width) {
        this.height = height;
        this.width = width;
    }

    get area() {
      return this.calcArea();
    }

    set color(hexCode) {
    }

    calcArea() {
      return this.height * this.width;
    }

    static draw(height, width) {
    }
}`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Anonymous Class Expression', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `return typeof class {} === "function";`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 super (object)', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var obj2 = {
        method2() {
         super.method1();
        }
      }`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Generator Function Declaration', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `function * generator(){
      };`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Generator Function Expression', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var generator = function * (){
      };`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Generator Shorthand Method', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var o = {
        * generator() {
        },
      };`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 Generator String-Keyed Shorthand Method', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var o = {
        * "foo bar"() {
        },
      };`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2015 yield', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `yield 5; yield 6;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2015);
});
ava_1.default('Level Check: ES2016 ** operator', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `return 2 ** 3 === 8 && -(5 ** 2) === -25 && (-5) ** 2 === 25;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2016);
});
ava_1.default('Level Check: ES2016 **= assignment', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var a = 2; a **= 3;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2016);
});
ava_1.default('Level Check: ES2016 Nested Rest Destructuring - Declarations', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var [x, ...[y, ...z]] = [1,2,3,4];`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2016);
});
ava_1.default('Level Check: ES2016 Nested Rest Destructuring - Parameters', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `function([x, ...[y, ...z]]) {
        return x === 1 && y === 2 && z + '' === '3,4';
        }`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2016);
});
ava_1.default('Level Check: ES2017 Function Trailing Commas - Parameters', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `function f(a, b, ){}`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2017);
});
ava_1.default('Level Check: ES2017 Function Trailing Commas - Parameters, Anonymous Function', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var f = function(a, b, ){}`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2017);
});
ava_1.default('Level Check: ES2017 Function Trailing Commas - Parameters, Arrow Function', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var f = (a, b, ) => {}`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2017);
});
ava_1.default('Level Check: ES2017 Function Trailing Commas - Parameters, Object Method', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var foo = {
        bar(a, b, ) { }
    }`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2017);
});
ava_1.default('Level Check: ES2017 Function Trailing Commas - Parameters, Class Method', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `class c {
        f(a, b, ) { }
    }`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2017);
});
ava_1.default('Level Check: ES2017 Function Trailing Commas - Parameters, Class Constructor', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `class c {
        constructor(a, b, ) { }
    }`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2017);
});
ava_1.default('Level Check: ES2017 Function Trailing Commas - Arguments', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `Math.min(1, 2, 3,)`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2017);
});
ava_1.default('Level Check: ES2017 Async Function', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `async function f(){}`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2017);
});
ava_1.default('Level Check: ES2017 await', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `await Axios.post('/api/hello', JSON.stringify('world'))`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2017);
});
ava_1.default('Level Check: ES2018 Object Rest Properties', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var {a, ...rest} = {a: 1, b: 2, c: 3};`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2018);
});
ava_1.default('Level Check: ES2018 Object Spread Properties', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var spread = {b: 2, c: 3};
    var O = {a: 1, ...spread};`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2018);
});
ava_1.default('Level Check: ES2018 Async Generator Function Declaration', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `async function * f(){
        yield 42;
    }`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2018);
});
ava_1.default('Level Check: ES2018 Async Generator Function Expression', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var f = async function* () {
        yield 42;
    }`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2018);
});
ava_1.default('Level Check: ES2018 Async Generator Object Method', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var o = {
        async * f() {
            yield 42;
        },
    };`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2018);
});
ava_1.default('Level Check: ES2018 Async Generator Class Method', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `class c {
        async * f() {
            yield 42;
        },
    }`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2018);
});
ava_1.default('Level Check: ES2018 for-await-of', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `for await(var value of asyncIterable)result += value;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2018);
});
ava_1.default('Level Check: ES2019 optional catch binding', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `try {
        throw new Error();
      }
      catch {
        return true;
      }`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2019);
});
ava_1.default('Level Check: ES2020 Big Int', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `const theBiggestInt = 9007199254740991n;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2020);
});
ava_1.default('Level Check: ES2020 Big Int Literal', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `const theBiggestInt = -0x8000000000000000n;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ES2020);
});
ava_1.default('Level Check: ESNext Public Instance Field', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `
class ClassWithInstanceField {
    instanceField = 'instance field';
}`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ESNext);
});
ava_1.default('Level Check: ESNext Optional Chaining Operator ?. on Properties', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var street = user.address?.street;`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ESNext);
});
ava_1.default('Level Check: ESNext Optional Chaining Operator ?. on Methods', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `var fooValue = myForm.querySelector('input[name=foo]')?.value`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ESNext);
});
ava_1.default('Level Check: ESNext Optional Chaining Operator ?. Call Variant', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `myForm.checkValidity?.()`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ESNext);
});
ava_1.default('Level Check: ESNext Null Coalescing Operator ??', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `const headerText = response.settings.headerText ?? 'Hello, world!';`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ESNext);
});
ava_1.default('Level Check: ESNext @decorator on Class', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `
@defineElement('my-class')
class MyClass extends HTMLElement { }
`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ESNext);
});
ava_1.default('Level Check: ESNext @decorator on Properties', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `
class Todo {
    id = Math.random()
    @observable title = ""
    @observable finished = false
    @observable todos = []
    @computed get unfinishedTodoCount() {
        return this.todos.filter(todo => !todo.finished).length
    }
}`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ESNext);
});
ava_1.default('Level Check: ESNext @decorator on Methods', t => {
    const check = SyntaxLevelChecker_1.checkSyntaxLevel('m.js', `
class C {
    @wrap(f) method() { }
}`, typescript_1.ScriptTarget.ESNext);
    t.is(check.level, typescript_1.ScriptTarget.ESNext);
});
