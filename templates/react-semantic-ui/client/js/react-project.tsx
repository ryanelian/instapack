import React from 'react';
import ReactDOM from 'react-dom';
import { Hello } from "./components/Hello";

ReactDOM.render(
    <Hello compiler="instapack" framework="React" />,
    document.getElementById('app')
);
