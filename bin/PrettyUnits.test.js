"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const PrettyUnits_1 = require("./PrettyUnits");
ava_1.default('SI Degree: 5', t => {
    let x = PrettyUnits_1.siDegree(5);
    t.is(x, 0);
});
ava_1.default('SI Degree: 500', t => {
    let x = PrettyUnits_1.siDegree(500);
    t.is(x, 0);
});
ava_1.default('SI Degree: 5000', t => {
    let x = PrettyUnits_1.siDegree(5000);
    t.is(x, 1);
});
ava_1.default('SI Degree: 500500', t => {
    let x = PrettyUnits_1.siDegree(500500);
    t.is(x, 1);
});
ava_1.default('SI Degree: 5000500', t => {
    let x = PrettyUnits_1.siDegree(5000500);
    t.is(x, 2);
});
ava_1.default('SI Degree: 50500500', t => {
    let x = PrettyUnits_1.siDegree(5000500);
    t.is(x, 2);
});
ava_1.default('SI Degree: 2500500500', t => {
    let x = PrettyUnits_1.siDegree(2500500500);
    t.is(x, 3);
});
ava_1.default('Pretty Bytes: 5', t => {
    let s = PrettyUnits_1.prettyBytes(5);
    t.is(s, '5 B');
});
ava_1.default('Pretty Bytes: 512', t => {
    let s = PrettyUnits_1.prettyBytes(512);
    t.is(s, '512 B');
});
ava_1.default('Pretty Bytes: 1024', t => {
    let s = PrettyUnits_1.prettyBytes(1024);
    t.is(s, '1.02 kB');
});
ava_1.default('Pretty Bytes: 55555', t => {
    let s = PrettyUnits_1.prettyBytes(55555);
    t.is(s, '55.6 kB');
});
ava_1.default('Pretty Bytes: 111222333', t => {
    let s = PrettyUnits_1.prettyBytes(111222333);
    t.is(s, '111 MB');
});
ava_1.default('Pretty Bytes: 9888777666', t => {
    let s = PrettyUnits_1.prettyBytes(9888777666);
    t.is(s, '9.89 GB');
});
ava_1.default('Pretty Seconds: 12.345', t => {
    let s = PrettyUnits_1.prettySeconds(12.345);
    t.is(s, '12.3 s');
});
ava_1.default('Pretty Seconds: 732.777', t => {
    let s = PrettyUnits_1.prettySeconds(732.777);
    t.is(s, '12 min 12.8 s');
});
ava_1.default('Pretty Seconds: 43932.777', t => {
    let s = PrettyUnits_1.prettySeconds(43932.777);
    t.is(s, '12 h 12 min 12.8 s');
});
ava_1.default('Pretty Milliseconds: 12345', t => {
    let s = PrettyUnits_1.prettyMilliseconds(12345);
    t.is(s, '12.3 s');
});
ava_1.default('Pretty Milliseconds: 123.789', t => {
    let s = PrettyUnits_1.prettyMilliseconds(124);
    t.is(s, '124 ms');
});
