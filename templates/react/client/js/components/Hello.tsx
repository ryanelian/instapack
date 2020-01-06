import React from 'react';
import { Alert } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

interface HelloProps {
    compiler: string;
    framework: string;
}

export class Hello extends React.Component<HelloProps, {}> {
    render(): JSX.Element {
        return <Alert color="success">
            <FontAwesomeIcon className="mr-3" icon={faCheckCircle}></FontAwesomeIcon>
            Hello from {this.props.compiler} and {this.props.framework}!
        </Alert>
    }
}
