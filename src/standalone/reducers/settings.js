import { objectNoId } from '../../reducers/object'

export const SETTINGS_INITIALSTATE = {
    comServerVersion: 'not connected',
    comServerIP: 'localhost:8000',
    comServerConnect: false,
    comInterfaces: [],
    comPorts: [],
    comAccumulatedJobTime: 0,

    connectVia: '',
    connectPort: '',
    connectBaud: '115200',
    connectIP: '',
}

export const settings = (state, action) => {
    return objectNoId('settings', SETTINGS_INITIALSTATE)(state, action);
}
