import * as Inferno from 'inferno';
import createElement from 'inferno-create-element';
import { Hello } from "./components";

Inferno.render(
    <Hello compiler="TypeScript" framework="Inferno" />,
    document.getElementById('app')
);
