import React from 'react';

interface HelloProps {
    compiler: string;
    framework: string;
}

// State is never set so we use the `undefined` type.
export class Hello extends React.Component<HelloProps, undefined> {
    render() {
        return <h1>Hello from {this.props.compiler} and {this.props.framework}!</h1>;
    }
}
