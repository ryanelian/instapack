import * as Vue from 'vue';

type VueAsync = () => Promise<typeof import('*.vue')>;

function renderAsyncComponent(tag: string, factory: VueAsync) {
    const ac = Vue.defineAsyncComponent(factory);
    const elements = document.getElementsByTagName(tag);
    
    for (const e of elements) {
        const props: Record<string, unknown> = {};
        // enable passing HTML attributes as component props
        if (e.hasAttributes()) {
            for (const attr of e.attributes) {
                if (attr.name.startsWith(':')) {
                    props[attr.name.substr(1)] = JSON.parse(attr.value);
                } else {
                    // simple string
                    props[attr.name] = attr.value;
                }
            }
        }

        const app = Vue.createApp(ac, props);
        app.mount(e);
    }
}

renderAsyncComponent('Hello', () => import('./components/Hello.vue'));
