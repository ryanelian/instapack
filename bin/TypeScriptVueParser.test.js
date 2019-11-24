"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const TypeScriptVueParser_1 = require("./TypeScriptVueParser");
ava_1.default('Parse TypeScript in Vue: Common', t => {
    const result = TypeScriptVueParser_1.parseTypeScriptInVueFile(`<template>
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
ava_1.default('Parse TypeScript in Vue: No lang', t => {
    const result = TypeScriptVueParser_1.parseTypeScriptInVueFile(`<template>
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
ava_1.default('Parse TypeScript in Vue: lang="coffee"', t => {
    const result = TypeScriptVueParser_1.parseTypeScriptInVueFile(`<template>
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
ava_1.default('Parse TypeScript in Vue: No Script', t => {
    const result = TypeScriptVueParser_1.parseTypeScriptInVueFile(`<template>
<h1>Hello from {{ compiler }} and {{ framework }}!</h1>
</template>`);
    t.is(result, ``);
});
ava_1.default('Parse TypeScript in Vue: Empty', t => {
    const result = TypeScriptVueParser_1.parseTypeScriptInVueFile(``);
    t.is(result, ``);
});
ava_1.default('Parse TypeScript in Vue: Malformed', t => {
    const result = TypeScriptVueParser_1.parseTypeScriptInVueFile(`<template
    <script`);
    t.is(result, ``);
});
