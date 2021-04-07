import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

/**
 * A factory function returning a Promise of React default-exported Component Class Module.
 */
type ReactAsyncComponentClassFactory = () => Promise<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: React.ComponentClass<any> | React.FunctionComponent<any>;
}>;

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
        let name = attribute.name;
        // reference: https://github.com/reactjs/react-magic/blob/3b14406a1dbd243f239d559951e03d4337d4d71f/src/htmltojsx.js#L26-L29
        if (name === 'for') {
            name = 'htmlFor';
        }
        if (name === 'class') {
            name = 'className';
        }
        name = hyphenToCamelCase(name);
        result[name] = attribute.value;
    }

    return result;
}

/**
 * For each matching HTML Elements, render and mount a React Component asynchronously.
 * Passes Element attributes as string to props. Kebab-case attributes will be converted to camel-case.
 * The attributes "for" will be converted to "htmlFor" and "class" to "className"
 * @param selector HTML Element selector query
 * @param lazyComponent React Async Component Class Factory function
 */
export function renderAsyncComponent(selector: string, lazyComponent: ReactAsyncComponentClassFactory): void {
    for (const el of document.querySelectorAll(selector)) {
        const LazyComponent = React.lazy(lazyComponent);
        const fallback = <FontAwesomeIcon icon={faSpinner} pulse></FontAwesomeIcon>
        const props = convertElementAttributesToPropsMap(el);
        const render = (
            <Suspense fallback={fallback}>
                <LazyComponent {...props}></LazyComponent>
            </Suspense>
        );
        ReactDOM.render(render, el);
    }
}
