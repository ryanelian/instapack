import m, { render } from 'mithril';
import { Hello } from "./components/Hello";

render(
    document.getElementById('app'),
    <Hello compiler="instapack" framework="Mithril" />
);
