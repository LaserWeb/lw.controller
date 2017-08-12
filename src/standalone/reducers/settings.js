import { objectNoId } from '../../reducers/object'

export const SETTINGS_INITIALSTATE = {
    comAccumulatedJobTime: 0,
    comServerIP: 'localhost:8000',
    comConnectVia: '',
    comConnectPort: '',
    comConnectBaud: 115200,
    comConnectIP: '',

    ctlJog1Dist: .1,
    ctlJog2Dist: 1,
    ctlJog3Dist: 10,
    ctlJog1Feed: 400,
    ctlJog2Feed: 400,
    ctlJog3Feed: 400,

    gcodeHoming: '$H',

    toolFeedUnits: 'mm/min',
};

export const settings = (state, action) => {
    return objectNoId('settings', SETTINGS_INITIALSTATE)(state, action);
}
