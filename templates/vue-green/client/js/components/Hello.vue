<template>
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
</script>
