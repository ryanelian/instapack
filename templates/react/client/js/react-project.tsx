import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Hello } from "./components";

ReactDOM.render(
    <Hello compiler="instapack" framework="React" />,
    document.getElementById('app')
);
