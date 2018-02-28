import Vue from 'vue';
import Component from 'vue-class-component';
import { render, staticRenderFns } from './Home.vue.html';
import { NotHome } from './NotHome';

@Component({
    render, staticRenderFns
})
export class Home extends Vue {
    changePage() {
        this.$emit('push-page', NotHome);
    }
}
