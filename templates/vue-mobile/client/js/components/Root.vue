<template>
<v-ons-navigator swipeable :page-stack="pageStack" @push-page="pageStack.push($event)"></v-ons-navigator>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import Home from './Home.vue';

@Component({
    created: function (this: Root) {
        this.initialize();
    }
})
export default class Root extends Vue {
    pageStack = [];

    initialize() {
        this.pageStack.push(Home);
    }
}
</script>
