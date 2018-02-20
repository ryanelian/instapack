import { Component } from 'inferno';
import { createElement } from 'inferno-create-element';

interface HelloProps {
    compiler: string;
    framework: string;
}

// State is never set so we use the `undefined` type.
export class Hello extends Component<HelloProps, undefined> {
    render() {
        console.log(this.props);
        return <h1>Hello from {this.props.compiler} and {this.props.framework}!</h1>;
    }
}
