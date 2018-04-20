<template>
<v-ons-page>
    <v-ons-toolbar>
        <div class="center">Page 1</div>
    </v-ons-toolbar>

    <!-- Your page content here. -->
    <p>
        <v-ons-button @click="changePage()">To Page 2</v-ons-button>
    </p>
</v-ons-page>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import NotHome from './NotHome.vue';

@Component({})
export default class Home extends Vue {
    changePage() {
        this.$emit('push-page', NotHome);
    }
}
</script>
