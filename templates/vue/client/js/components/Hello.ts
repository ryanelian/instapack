import Vue from 'vue';
import Component from 'vue-class-component';
import { render, staticRenderFns } from '!vue-aot!./Hello.html';

@Component({
    render, staticRenderFns,
    props: ['framework', 'compiler']
})
export class Hello extends Vue {
    framework: string;
    compiler: string;
}
