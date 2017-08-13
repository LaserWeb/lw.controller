import { objectNoId } from '../reducers/object'

export const COM_INITIALSTATE = {
    serverConnecting: false,
    serverConnected: false,
    machineConnecting: false,
    machineConnected: false,
    serverVersion: 'not connected',
    interfaces: [],
    ports: [],
    machineStatus: '',
    runStatus: '',
    playing: false,
    paused: false,
    m0: false,
    alarm: false,
    laserTestOn: false,
    firmware: '',
    firmwareVersion: '',

    axes: ['x', 'y', 'z'],

    'work-offset-x': 0,
    'work-offset-y': 0,
    'work-offset-z': 0,
    'work-offset-a': 0,

    'wpos-x': 0,
    'wpos-y': 0,
    'wpos-z': 0,
    'wpos-a': 0,
};

export function com(state = COM_INITIALSTATE, action) {
    state = objectNoId('com', COM_INITIALSTATE)(state, action);
    return state;
}
