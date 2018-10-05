import test from "ava";
import { siDegree, prettyBytes, prettySeconds, prettyMilliseconds } from "./PrettyUnits";

test('SI Degree: 5', t => {
    let x = siDegree(5);
    t.is(x, 0);
});

test('SI Degree: 500', t => {
    let x = siDegree(500);
    t.is(x, 0);
});

test('SI Degree: 5000', t => {
    let x = siDegree(5000);
    t.is(x, 1);
});

test('SI Degree: 500500', t => {
    let x = siDegree(500500);
    t.is(x, 1);
});

test('SI Degree: 5000500', t => {
    let x = siDegree(5000500);
    t.is(x, 2);
});

test('SI Degree: 50500500', t => {
    let x = siDegree(5000500);
    t.is(x, 2);
});

test('SI Degree: 2500500500', t => {
    let x = siDegree(2500500500);
    t.is(x, 3);
});

test('Pretty Bytes: 5', t => {
    let s = prettyBytes(5);
    t.is(s, '5 B');
});

test('Pretty Bytes: 512', t => {
    let s = prettyBytes(512);
    t.is(s, '512 B');
});

test('Pretty Bytes: 1024', t => {
    let s = prettyBytes(1024);
    t.is(s, '1.02 kB');
});

test('Pretty Bytes: 55555', t => {
    let s = prettyBytes(55555);
    t.is(s, '55.6 kB');
});

test('Pretty Bytes: 111222333', t => {
    let s = prettyBytes(111222333);
    t.is(s, '111 MB');
});

test('Pretty Bytes: 9888777666', t => {
    let s = prettyBytes(9888777666);
    t.is(s, '9.89 GB');
});

test('Pretty Seconds: 12.345', t => {
    let s = prettySeconds(12.345);
    t.is(s, '12.3 s');
});

test('Pretty Seconds: 732.777', t => {
    let s = prettySeconds(732.777);
    t.is(s, '12 min 12.8 s');
});

test('Pretty Seconds: 43932.777', t => {
    let s = prettySeconds(43932.777);
    t.is(s, '12 h 12 min 12.8 s');
});

test('Pretty Milliseconds: 12345', t => {
    let s = prettyMilliseconds(12345);
    t.is(s, '12.3 s');
});

test('Pretty Milliseconds: 123.789', t => {
    let s = prettyMilliseconds(124);
    t.is(s, '124 ms');
});
