import { objectNoId } from '../../reducers/object'

export const SETTINGS_INITIALSTATE = {
    comAccumulatedJobTime: 0,
    comServerIP: 'localhost:8000',
    connectVia: '',
    connectPort: '',
    connectBaud: 115200,
    connectIP: '',
}

export const settings = (state, action) => {
    return objectNoId('settings', SETTINGS_INITIALSTATE)(state, action);
}
