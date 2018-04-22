import { h, render } from 'preact';
import { Hello } from "./components/Hello";

render(
    <Hello compiler="instapack" framework="Preact" />,
    document.getElementById('app')
);
