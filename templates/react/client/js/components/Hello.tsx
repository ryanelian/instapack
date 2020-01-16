import React from 'react';
import { Alert } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

@observer
export class Hello extends React.Component {
    @observable isVisible = true;

    // This syntax ensures `this` is bound within onDismiss.
    onDismiss = (): void => {
        this.isVisible = false;
    }

    render(): JSX.Element {
        return <Alert color="success" toggle={this.onDismiss} isOpen={this.isVisible}>
            <FontAwesomeIcon className="mr-3" icon={faCheckCircle}></FontAwesomeIcon>
            Hello from instapack and react!
        </Alert>
    }
}

export default Hello;
