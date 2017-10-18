import { VNode } from 'vue';

declare global {
    interface VueCompiledTemplate {
        render: () => VNode;
        staticRenderFns: (() => VNode)[];
    }

    module '*.html' {
        let _: VueCompiledTemplate;
        export = _;
    }
}
