import { render } from 'inferno';
import { createElement } from 'inferno-create-element';
import { Hello } from "./components";

render(
    <Hello compiler="instapack" framework="Inferno" />,
    document.getElementById('app')
);
