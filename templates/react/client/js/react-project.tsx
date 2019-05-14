import React from 'react';
import ReactDOM from 'react-dom';
import { Hello } from "./components/Hello";

import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
initializeIcons(window.location.origin + '/fonts/');
// Offline      : Manually copy /node_modules/@uifabric/icons/fonts to /wwwroot/fonts/
// Online CDN   : Remove parameter from initializeIcons()

ReactDOM.render(
    <Hello compiler="instapack" framework="React + Fabric" />,
    document.getElementById('app')
);
