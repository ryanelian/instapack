import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';

export const Hello: React.FunctionComponent<{
    language: string;
    sdk: string;
}> = function (props) {
    return (
        // if using state is required, use state hook:
        // https://reactjs.org/docs/hooks-state.html

        <div className="alert alert-success alert-dismissible fade show" role="alert">
            <FontAwesomeIcon className="me-3" icon={faCheckCircle}></FontAwesomeIcon>
            Hello from {props.sdk} and {props.language}!
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    );
}

Hello.propTypes = {
    language: PropTypes.string.isRequired,
    sdk: PropTypes.string.isRequired
};

export default Hello;
