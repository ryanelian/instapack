import test from "ava";
import { parseTypeScriptInVueFile } from "./TypeScriptVueParser";

test('Parse TypeScript in Vue: Common', t => {
    const result = parseTypeScriptInVueFile(`<template>
<h1>Hello from {{ compiler }} and {{ framework }}!</h1>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
    props: ['framework', 'compiler']
})
export default class Hello extends Vue {
    framework: string;
    compiler: string;
}
</script>`);

    t.is(result, `//
//
//
//

import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
    props: ['framework', 'compiler']
})
export default class Hello extends Vue {
    framework: string;
    compiler: string;
}
`);
});

test('Parse TypeScript in Vue: No lang', t => {
    const result = parseTypeScriptInVueFile(`<template>
<h1>Hello from {{ compiler }} and {{ framework }}!</h1>
</template>

<script>
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
    props: ['framework', 'compiler']
})
export default class Hello extends Vue {
    framework: string;
    compiler: string;
}
</script>`);

    t.is(result, ``);
});

test('Parse TypeScript in Vue: lang="coffee"', t => {
    const result = parseTypeScriptInVueFile(`<template>
<h1>Hello from {{ compiler }} and {{ framework }}!</h1>
</template>

<script lang="coffee">
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
    props: ['framework', 'compiler']
})
export default class Hello extends Vue {
    framework: string;
    compiler: string;
}
</script>`);

    t.is(result, ``);
});

test('Parse TypeScript in Vue: No Script', t => {
    const result = parseTypeScriptInVueFile(`<template>
<h1>Hello from {{ compiler }} and {{ framework }}!</h1>
</template>`);

    t.is(result, ``);
});

test('Parse TypeScript in Vue: Empty', t => {
    const result = parseTypeScriptInVueFile(``);

    t.is(result, ``);
});

test('Parse TypeScript in Vue: Malformed', t => {
    const result = parseTypeScriptInVueFile(`<template
    <script`);

    t.is(result, ``);
});
