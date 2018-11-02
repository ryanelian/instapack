import test from "ava";
import { checkSyntaxLevel } from "./SyntaxLevelChecker";
import { ScriptTarget } from "typescript";

test('Level Check: ES2015 Function Parameters', t => {
    let check = checkSyntaxLevel('module.js', `function (a = 1, b = 2) { return a === 3 && b === 2; }`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Rest Parameters', t => {
    let check = checkSyntaxLevel('module.js', `return (function (foo, ...args) {}`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Spread Function Calls', t => {
    let check = checkSyntaxLevel('module.js', `Math.max(...[1, 2, 3])`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Spread Arrays', t => {
    let check = checkSyntaxLevel('module.js', `[...[1, 2, 3]]`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Spread Strings', t => {
    let check = checkSyntaxLevel('module.js', `Math.max(..."1234")`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Spread Strings in Arrays', t => {
    let check = checkSyntaxLevel('module.js', `["a", ..."bcd", "e"]`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Computed Properties', t => {
    let check = checkSyntaxLevel('module.js', `var x = 'y';
    return ({ [x]: 1 }).y === 1;`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Shorthand Properties', t => {
    let check = checkSyntaxLevel('module.js', `var a = 7, b = 8, c = {a,b};`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Shorthand Methods', t => {
    let check = checkSyntaxLevel('module.js', `({ y() { return 2; } })`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 String-Keyed Shorthand Methods', t => {
    let check = checkSyntaxLevel('module.js', `({ "foo bar"() { return 4; } })`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Computed Shorthand Methods', t => {
    let check = checkSyntaxLevel('module.js', `var x = 'y';
    var o = { [x](){ return 1 } }`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Computed Accessors', t => {
    let check = checkSyntaxLevel('module.js', `var x = 'y',
    obj = {
      get [x] () { return 1 },
      set [x] (value) { valueSet = value }
    };`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 for..of Arrays', t => {
    let check = checkSyntaxLevel('module.js', `var arr = [5];
    for (var item of arr)
      return item === 5;`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 for..of Strings', t => {
    let check = checkSyntaxLevel('module.js', `var str = "";
    for (var item of "foo")
      str += item;`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Octal Numeric Literal', t => {
    let check = checkSyntaxLevel('module.js', `return 0o10 === 8 && 0O10 === 8;`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Binary Numeric Literal', t => {
    let check = checkSyntaxLevel('module.js', `return 0b10 === 2 && 0B10 === 2;`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Template Literal', t => {
    let check = checkSyntaxLevel('module.js', 'var a = "ba", b = "QUX"; return `foo bar ${a + "z"} ${b.toLowerCase()}` === "foo bar\nbaz qux";', ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Tagged Template Literal', t => {
    let check = checkSyntaxLevel('module.js', `var called = false;
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
    ` + 'return fn `foo${123}bar\n${456}` && called;', ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Declarations - Arrays', t => {
    let check = checkSyntaxLevel('module.js', `var [a, , [b], c] = [5, null, [6]];`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Declarations - Strings', t => {
    let check = checkSyntaxLevel('module.js', `var [a, b, c] = "ab";`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Declarations - Objects', t => {
    let check = checkSyntaxLevel('module.js', `var {c, x:d, e} = {c:7, x:8};`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Declarations - Primitives', t => {
    let check = checkSyntaxLevel('module.js', `var {toFixed} = 2;
    var {slice} = '';`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Declarations - Multiple var', t => {
    let check = checkSyntaxLevel('module.js', `var [a,b] = [5,6], {c,d} = {c:7,d:8};`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Declarations - Nested', t => {
    let check = checkSyntaxLevel('module.js', `var [e, {x:f, g}] = [9, {x:10}];
    var {h, x:[i]} = {h:11, x:[12]};`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Declarations - for..in', t => {
    let check = checkSyntaxLevel('module.js', `for(var [i, j, k] in { qux: 1 }) {
        return i === "q" && j === "u" && k === "x";
      }`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Declarations - catch', t => {
    let check = checkSyntaxLevel('module.js', `try {
        throw [1,2];
      } catch([i,j]) {
      }`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Declarations - Rest', t => {
    let check = checkSyntaxLevel('module.js', `var [a, ...b] = [3, 4, 5];
    var [c, ...d] = [6];`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Declarations - Defaults', t => {
    let check = checkSyntaxLevel('module.js', `var {a = 1, b = 0, z:c = 3} = {b:2, z:undefined};
    var [d = 0, e = 5, f = 6] = [4,,undefined];`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Assignment - Arrays', t => {
    let check = checkSyntaxLevel('module.js', `var a,b,c;
    [a, , [b], c] = [5, null, [6]];`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Assignment - Strings', t => {
    let check = checkSyntaxLevel('module.js', `var a,b,c;
    [a, b, c] = "ab";`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Assignment - Objects', t => {
    let check = checkSyntaxLevel('module.js', `var c,d,e;
    ({c, x:d, e} = {c:7, x:8});`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Assignment - Primitives', t => {
    let check = checkSyntaxLevel('module.js', `var toFixed, slice;
    ({toFixed} = 2);
    ({slice} = '');`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Assignment - Object Expression', t => {
    let check = checkSyntaxLevel('module.js', `var a, b, obj = { a:1, b:2 };
    return ({a,b} = obj) === obj;`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Assignment - Chain Object', t => {
    let check = checkSyntaxLevel('module.js', `var a,b,c,d;
    ({a,b} = {c,d} = {a:1,b:2,c:3,d:4});`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Assignment - Nested', t => {
    let check = checkSyntaxLevel('module.js', `var e,f,g,h,i;
    [e, {x:f, g}] = [9, {x:10}];
    ({h, x:[i]} = {h:11, x:[12]});`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Assignment - Rest', t => {
    let check = checkSyntaxLevel('module.js', `var a,b,c,d;
    [a, ...b] = [3, 4, 5];
    [c, ...d] = [6];`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Assignment - Nested Rest', t => {
    let check = checkSyntaxLevel('module.js', `var a = [1, 2, 3], first, last;
    [first, ...[a[2], last]] = a;`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Assignment - Empty', t => {
    let check = checkSyntaxLevel('module.js', `[] = [1,2];
    ({} = {a:1,b:2});`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Assignment - Defaults', t => {
    let check = checkSyntaxLevel('module.js', `var a,b,c,d,e,f;
    ({a = 1, b = 0, z:c = 3} = {b:2, z:undefined});
    [d = 0, e = 5, f = 6] = [4,,undefined];`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Parameters - Arrays', t => {
    let check = checkSyntaxLevel('module.js', `function([a, , [b], c]) {
        return a === 5 && b === 6 && c === undefined;
      }([5, null, [6]])`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Parameters - Strings', t => {
    let check = checkSyntaxLevel('module.js', `function([a, b, c]) {
        return a === "a" && b === "b" && c === undefined;
      }("ab")`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Parameters - Objects', t => {
    let check = checkSyntaxLevel('module.js', `function({c, x:d, e}) {
        return c === 7 && d === 8 && e === undefined;
      }({c:7, x:8});`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Parameters - Primitives', t => {
    let check = checkSyntaxLevel('module.js', `function({toFixed}, {slice}) {
        return toFixed === Number.prototype.toFixed
          && slice === String.prototype.slice;
      }(2,'')`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Parameters - Nested', t => {
    let check = checkSyntaxLevel('module.js', `function([e, {x:f, g}], {h, x:[i]}) {
        return e === 9 && f === 10 && g === undefined
          && h === 11 && i === 12;
      }([9, {x:10}],{h:11, x:[12]});`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Parameters - Rest', t => {
    let check = checkSyntaxLevel('module.js', `function([a, ...b], [c, ...d]) {
        return a === 3 && b instanceof Array && (b + "") === "4,5" &&
           c === 6 && d instanceof Array && d.length === 0;
      }([3, 4, 5], [6]);`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Parameters - Empty', t => {
    let check = checkSyntaxLevel('module.js', `function ([],{}){
        return arguments[0] + '' === "3,4" && arguments[1].x === "foo";
      }([3,4],{x:"foo"});`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Parameters - Defaults', t => {
    let check = checkSyntaxLevel('module.js', `(function({a = 1, b = 0, c = 3, x:d = 0, y:e = 5},
        [f = 6, g = 0, h = 8]) {
      return a === 1 && b === 2 && c === 3 && d === 4 &&
        e === 5 && f === 6 && g === 7 && h === 8;
    }({b:2, c:undefined, x:4},[, 7, undefined]));`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Destructuring Parameters - Defaults, Separate Scope', t => {
    let check = checkSyntaxLevel('module.js', `(function({a=function(){
        return typeof b === 'undefined';
      }}){
        var b = 1;
        return a();
      }({}));`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

// TODO: ES2015 Destructuring Parameters

test('Level Check: ES2015 new.target', t => {
    let check = checkSyntaxLevel('module.js', `var passed = false;
    new function f() {
      passed = (new.target === f);
    }();`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 let', t => {
    let check = checkSyntaxLevel('module.js', `let foo = 123;`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 const', t => {
    let check = checkSyntaxLevel('module.js', `const foo = 123;`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Arrow Functions - 0 parameters', t => {
    let check = checkSyntaxLevel('module.js', `(() => 5)`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Arrow Functions - 1 parameter, no brackets', t => {
    let check = checkSyntaxLevel('module.js', `var b = x => x + "foo";`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Arrow Functions - Multiple Parameters', t => {
    let check = checkSyntaxLevel('module.js', `var c = (v, w, x, y, z) => "" + v + w + x + y + z;`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Class', t => {
    let check = checkSyntaxLevel('module.js', `class C {}`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Anonymous Class Expression', t => {
    let check = checkSyntaxLevel('module.js', `return typeof class {} === "function";`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 super (object)', t => {
    let check = checkSyntaxLevel('module.js', `var obj2 = {
        method2() {
         super.method1();
        }
      }`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Generator Function Declaration', t => {
    let check = checkSyntaxLevel('module.js', `function * generator(){
      };`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Generator Function Expression', t => {
    let check = checkSyntaxLevel('module.js', `var generator = function * (){
      };`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Generator Shorthand Method', t => {
    let check = checkSyntaxLevel('module.js', `var o = {
        * generator() {
        },
      };`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 Generator String-Keyed Shorthand Method', t => {
    let check = checkSyntaxLevel('module.js', `var o = {
        * "foo bar"() {
        },
      };`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2015 yield', t => {
    let check = checkSyntaxLevel('module.js', `yield 5; yield 6;`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2015);
});

test('Level Check: ES2016 ** operator', t => {
    let check = checkSyntaxLevel('module.js', `return 2 ** 3 === 8 && -(5 ** 2) === -25 && (-5) ** 2 === 25;`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2016);
});

test('Level Check: ES2016 **= assignment', t => {
    let check = checkSyntaxLevel('module.js', `var a = 2; a **= 3;`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2016);
});

test('Level Check: ES2016 Nested Rest Destructuring - Declarations', t => {
    let check = checkSyntaxLevel('module.js', `var [x, ...[y, ...z]] = [1,2,3,4];`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2016);
});

test('Level Check: ES2016 Nested Rest Destructuring - Parameters', t => {
    let check = checkSyntaxLevel('module.js', `function([x, ...[y, ...z]]) {
        return x === 1 && y === 2 && z + '' === '3,4';
        }`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2016);
});

test('Level Check: ES2017 Function Trailing Commas - Parameters', t => {
    let check = checkSyntaxLevel('module.js', `function f(a, b, ){}`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2017);
});

test('Level Check: ES2017 Function Trailing Commas - Parameters, Anonymous Function', t => {
    let check = checkSyntaxLevel('module.js', `var f = function(a, b, ){}`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2017);
});

test('Level Check: ES2017 Function Trailing Commas - Parameters, Arrow Function', t => {
    let check = checkSyntaxLevel('module.js', `var f = (a, b, ) => {}`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2017);
});

test('Level Check: ES2017 Function Trailing Commas - Parameters, Object Method', t => {
    let check = checkSyntaxLevel('module.js', `var foo = {
        bar(a, b, ) { }
    }`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2017);
});

test('Level Check: ES2017 Function Trailing Commas - Parameters, Class Method', t => {
    let check = checkSyntaxLevel('module.js', `class c {
        f(a, b, ) { }
    }`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2017);
});

test('Level Check: ES2017 Function Trailing Commas - Parameters, Class Constructor', t => {
    let check = checkSyntaxLevel('module.js', `class c {
        constructor(a, b, ) { }
    }`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2017);
});

test('Level Check: ES2017 Function Trailing Commas - Arguments', t => {
    let check = checkSyntaxLevel('module.js', `Math.min(1, 2, 3,)`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2017);
});

test('Level Check: ES2017 Async Function', t => {
    let check = checkSyntaxLevel('module.js', `async function f(){}`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2017);
});

test('Level Check: ES2017 await', t => {
    let check = checkSyntaxLevel('module.js', `await Axios.post('/api/hello', JSON.stringify('world'))`, ScriptTarget.ESNext);
    t.is(check.level, ScriptTarget.ES2017);
});

