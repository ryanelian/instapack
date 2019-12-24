import { Component } from 'inferno';

interface HelloProps {
    compiler: string;
    framework: string;
}

export class Hello extends Component<HelloProps, undefined> {
    render(): JSX.Element {
        return <h1>Hello from {this.props.compiler} and {this.props.framework}!</h1>
    }
}
