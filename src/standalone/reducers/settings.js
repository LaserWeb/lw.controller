import { objectNoId } from '../../reducers/object'

export const SETTINGS_INITIALSTATE = {
    comAccumulatedJobTime: 0,
    comServerIP: 'localhost:8000',
    comConnectVia: '',
    comConnectPort: '',
    comConnectBaud: 115200,
    comConnectIP: '',
};

export const settings = (state, action) => {
    return objectNoId('settings', SETTINGS_INITIALSTATE)(state, action);
}
