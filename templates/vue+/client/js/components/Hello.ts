import * as Vue from 'vue'
import Component from 'vue-class-component'

import template = require('./Hello.html');

@Component({
    render: template.render,
    staticRenderFns: template.staticRenderFns,
    props: ['framework', 'compiler']
})
export class Hello extends Vue {
    framework: string;
    compiler: string;
}
