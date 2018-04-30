import { render } from 'inferno';
import { Hello } from "./components/Hello";

render(
    <Hello compiler="instapack" framework="Inferno" />,
    document.getElementById('app')
);
