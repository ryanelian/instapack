import Vue from 'vue';
import Component from 'vue-class-component';
import { render, staticRenderFns } from './Root.vue.html';
import { Home } from './Home';

@Component({
    render, staticRenderFns,
    created: function (this: Root) {
        this.initialize();
    }
})
export class Root extends Vue {
    pageStack = [];

    initialize() {
        this.pageStack.push(Home);
    }
}
