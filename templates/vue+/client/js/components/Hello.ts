import * as Vue from 'vue'
import Component from 'vue-class-component'
import { render, staticRenderFns } from './Hello.html';

@Component({
    render: render,
    staticRenderFns: staticRenderFns,
    props: ['framework', 'compiler']
})
export class Hello extends Vue {
    framework: string;
    compiler: string;
}
