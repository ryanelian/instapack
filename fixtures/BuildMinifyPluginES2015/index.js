const foo = function foo(bar) {
    return bar.length;
}

// window object required to prevent dead code elimination in the unit test!
window.x = foo('abc123');
