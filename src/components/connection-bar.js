import React from 'react';

import { StringInput, NumberInput, SelectInput, Field } from './fields';

export default class ConnectionBar extends React.Component {
    render() {
        let { settings, dispatchSetSettingsAttrs, com, comComponent } = this.props;

        let serverButtonText;
        if (com.serverConnecting)
            serverButtonText = 'Cancel';
        else if (com.serverConnected)
            serverButtonText = 'Disconnect';
        else
            serverButtonText = 'Connect';

        let machineButtonText;
        if (com.machineConnecting)
            machineButtonText = 'Cancel';
        else if (com.machineConnected)
            machineButtonText = 'Disconnect';
        else
            machineButtonText = 'Connect';

        let portOrIp;
        if (settings.comConnectVia === 'USB')
            portOrIp = <span>
                <label>Port:</label>
                <Field {...{
                    Input: SelectInput, setAttrs: dispatchSetSettingsAttrs, attrs: settings,
                    name: 'comConnectPort', options: com.ports,
                    disabled: !com.serverConnected || com.machineConnected,
                }} />
            </span>;
        else
            portOrIp = <span>
                <label>IP:</label>
                <Field {...{
                    Input: StringInput, setAttrs: dispatchSetSettingsAttrs, attrs: settings,
                    name: 'comConnectIP', disabled: !com.serverConnected || com.machineConnected,
                }} />
            </span>;

        return (
            <div className="connection-bar">
                <label>Server:</label>
                <Field {...{
                    Input: StringInput, setAttrs: dispatchSetSettingsAttrs, attrs: settings,
                    name: 'comServerIP', disabled: com.serverConnecting || com.serverConnected
                }} />

                <button onClick={e => comComponent.toggleConnectToServer()}>{serverButtonText}</button>

                <label>Type:</label>
                <Field {...{
                    Input: SelectInput, setAttrs: dispatchSetSettingsAttrs, attrs: settings,
                    name: 'comConnectVia', options: com.interfaces,
                    disabled: !com.serverConnected || com.machineConnected
                }} />

                {portOrIp}

                <button disabled={!com.serverConnected} onClick={e => comComponent.toggleConnectToMachine()}>{machineButtonText}</button>
            </div>
        );
    }
} // ConnectionBar
