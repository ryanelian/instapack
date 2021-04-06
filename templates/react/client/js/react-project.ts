import { renderAsyncComponent } from './react-renderer';

// use this file to render top-level components asynchronously. 

// for example: allows calling <Hello sdk="instapack" language="react"></Hello> in HTML!
renderAsyncComponent('Hello', () => import('./components/Hello'));
