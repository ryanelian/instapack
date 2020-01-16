import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

/**
 * A factory function returning a Promise of React default-exported Component Class Module.
 */
type ReactAsyncComponentClassFactory = () => Promise<{
    default: React.ComponentClass;
}>;

/**
 * For each matching HTML Elements, render and mount a React Component asynchronously without props.
 * @param selector HTML Element selector query
 * @param lazyComponent React Async Component Class Factory function
 */
function renderAsyncComponent(selector: string, lazyComponent: ReactAsyncComponentClassFactory): void {
    for (const el of document.querySelectorAll(selector)) {
        const LazyComponent = React.lazy(lazyComponent);
        const fallback = <FontAwesomeIcon icon={faSpinner} pulse></FontAwesomeIcon>
        const render = <Suspense fallback={fallback}>
            <LazyComponent></LazyComponent>
        </Suspense>;
        ReactDOM.render(render, el);
    }
}

renderAsyncComponent('Hello', () => import('./components/Hello'));
// now <Hello></Hello> can be invoked in DOM!
// add more components to be rendered in DOM here ^
