import { h, Component, JSX } from 'preact';

interface HelloProps {
    compiler: string;
    framework: string;
}

export class Hello extends Component<HelloProps, {}> {
    render(): JSX.Element {
        return <h1>Hello from {this.props.compiler} and {this.props.framework}!</h1>
    }
}
