<template>
<v-ons-page>
    <v-ons-toolbar>
        <div class="left">
            <v-ons-back-button>Page 1</v-ons-back-button>
        </div>
        <div class="center">Page 2</div>
    </v-ons-toolbar>

    <!-- Your page content here. -->
</v-ons-page>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({})
export default class NotHome extends Vue {}
</script>
