import * as Vue from 'vue';

type VueAsync = () => Promise<typeof import('*.vue')>;

type ConfigureVueApp = (app: Vue.App<Element>) => void;

/**
 * Convert a hyphenated string to camelCase.
 */
function hyphenToCamelCase(name: string) {
    return name.replace(/-(.)/g, (_match: string, char: string) => {
        return char.toUpperCase();
    });
}

/**
 * Attempts to extract element attributes as string map.
 * @param el 
 * @returns 
 */
function convertElementAttributesToPropsMap(el: Element): Record<string, string> {
    if (el.hasAttributes() === false) {
        return {};
    }
    const result: Record<string, string> = {};

    for (const attribute of el.attributes) {
        const name = hyphenToCamelCase(attribute.name);
        result[name] = attribute.value;
    }

    return result;
}

/**
 * For each matching HTML Elements, render and mount a Vue Component asynchronously.
 * Passes Element attributes as string to props. Kebab-case attributes will be converted to camel-case.
 * @param tag 
 * @param factory 
 * @param configure 
 */
export function renderAsyncComponent(tag: string, factory: VueAsync, configure?: ConfigureVueApp) {
    const ac = Vue.defineAsyncComponent(factory);
    const elements = document.getElementsByTagName(tag);

    for (const el of elements) {
        const props = convertElementAttributesToPropsMap(el)
        const app = Vue.createApp(ac, props);
        if (configure) {
            configure(app);
        }
        app.mount(el);
    }
}
