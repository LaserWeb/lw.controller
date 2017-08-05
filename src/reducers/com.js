import { objectNoId } from '../reducers/object'

export const COM_INITIALSTATE = {
    serverConnected: false,
    machineConnected: false,
    comServerVersion: 'not connected',
    comInterfaces: [],
    comPorts: [],
    machineStatus: '',
    runStatus: '',
    playing: false,
    paused: false,
    m0: false,
    laserTestOn: false,
    firmware: '',
    firmwareVersion: '',
    workOffset: [0, 0, 0, 0],
    wpos: [0, 0, 0, 0],
}

export function com(state = COM_INITIALSTATE, action) {
    state = objectNoId('com', COM_INITIALSTATE)(state, action);
    return state;
}
