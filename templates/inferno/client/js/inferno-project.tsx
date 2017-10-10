import * as Inferno from 'inferno';
import h from 'inferno-create-element';
import { Hello } from "./components";

Inferno.render(
    <Hello compiler="instapack" framework="Inferno" />,
    document.getElementById('app')
);
