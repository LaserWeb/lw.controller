import React from 'react';
import { connect } from 'react-redux';

export default class ConnectionBar extends React.Component {
    render() {
        let { settings, com } = this.props;
        let elements = [];
        if (!com.machineConnected) {
            elements.push(
                "Server:"
            );
        }
        return <div>{elements}</div>;
    }
} // ConnectionBar
ConnectionBar = connect(
    ({ settings, com }) => ({ settings, com }),
)(ConnectionBar);
export { ConnectionBar };
