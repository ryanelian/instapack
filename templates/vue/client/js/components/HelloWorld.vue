<template>
    <div class="alert alert-success">
        <fa-icon
            icon="check"
            class="mr-3"
        ></fa-icon>
        Hello from instapack and Vue!
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
})
export default class HelloWorld extends Vue {
}
</script>
