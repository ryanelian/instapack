import { h, render } from 'preact';
import { Hello } from "./components/Hello";

const el = document.getElementById('app');
if (el) {
    render(
        <Hello compiler="instapack" framework="Preact" />,
        el
    );
}
