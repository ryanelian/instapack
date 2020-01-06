import React from 'react';
import ReactDOM from 'react-dom';
import { Hello } from "./components/Hello";

interface MapLike<T> {
    [key: string]: T;
}

// Allow developer to register all components into a map object to be rendered by tag name.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renders: MapLike<React.ComponentClass<any, any>> = {};
renders['Hello'] = Hello;

for (const tag in renders) {
    const Component = renders[tag];
    const elements = document.getElementsByTagName(tag);

    for (const e of elements) {
        const attributes: MapLike<string> = {};
        for (const attr of e.attributes) {
            attributes[attr.name] = attr.value;
        }
        ReactDOM.render(<Component {...attributes}></Component>, e);
    }
}

// now you can do <Hello compiler="instapack" framework="react"></Hello> in DOM!
