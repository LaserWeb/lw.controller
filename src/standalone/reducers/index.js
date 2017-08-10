import { combineReducers } from 'redux'
import { com } from '../../reducers/com'
import { gcode } from '../reducers/gcode'
import { settings } from '../reducers/settings'

const combinedReducer = combineReducers({ settings, gcode, com });

export default function reducer(state, action) {
    return combinedReducer(state, action);
}
