import React from 'react';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';

interface HelloProps {
    compiler: string;
    framework: string;
}

export class Hello extends React.Component<HelloProps, {}> {
    render(): JSX.Element {
        return <MessageBar messageBarType={MessageBarType.success}>Hello from {this.props.compiler} and {this.props.framework}!</MessageBar>
    }
}
