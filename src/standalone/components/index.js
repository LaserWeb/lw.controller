import React from 'react'
import { connect } from 'react-redux';

import { store } from '../index.js';
import { setComAttrs } from '../../actions/com';
import { setGcode } from '../actions/gcode';
import { setSettingsAttrs } from '../actions/settings';
import { Com } from '../../components/com'
import Controller from '../../components/controller'
import ConnectionBar from '../../components/connection-bar'

import 'font-awesome/css/font-awesome.min.css'

function getSettingsAttrs() {
    return store.getState().settings;
}

function dispatchSetSettingsAttrs(settingsAttrs) {
    let settings = store.getState().settings;
    for (let attr in settingsAttrs) {
        if (settings[attr] !== settingsAttrs[attr]) {
            store.dispatch(setSettingsAttrs(settingsAttrs));
            return;
        }
    }
}

function getComAttrs() {
    return store.getState().com;
}

function dispatchSetComAttrs(comAttrs) {
    let com = store.getState().com;
    for (let attr in comAttrs) {
        if (com[attr] !== comAttrs[attr]) {
            store.dispatch(setComAttrs(comAttrs));
            return;
        }
    }
}

function dispatchSetGcode(gcode) {
    store.dispatch(setGcode(gcode));
}

function Main(props) {
    let { settings, com, gcode } = props;
    return (
        <Com
            style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}
            {...{ settings, getSettingsAttrs, dispatchSetSettingsAttrs, com, getComAttrs, dispatchSetComAttrs }}
        >
            <ConnectionBar style={{ flex: '0 0' }} {...{ settings, dispatchSetSettingsAttrs, com }} />
            <div style={{ flex: '1 1', border: '20px solid green', position: 'relative', overflow: 'visible' }}>
                <Controller {...{ settings, com, gcode, dispatchSetGcode, dispatchSetSettingsAttrs }} />
            </div>
        </Com >
    );
}
Main = connect(
    ({ settings, com, gcode }) => ({ settings, com, gcode }),
)(Main);
export default Main;
