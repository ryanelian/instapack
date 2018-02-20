import { VNode } from 'vue';

declare global {
    interface VueCompiledTemplate {
        render: () => VNode;
        staticRenderFns: (() => VNode)[];
    }

    module '!vue-aot!*.html' {
        let _: VueCompiledTemplate;
        export = _;
    }
}