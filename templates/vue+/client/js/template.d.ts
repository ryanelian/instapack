import Vue from 'vue';

declare global {
    interface CompiledVueTemplate {
        render: Vue.CreateElement,
        staticRenderFns: ((createElement: Vue.CreateElement) => Vue.VNode)[]
    }

    module '*.html' {
        let _: CompiledVueTemplate;
        export = _;
    }
}
