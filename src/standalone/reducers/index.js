import { combineReducers } from 'redux'
import { com } from '../../reducers/com'
import { settings } from '../reducers/settings'

const combinedReducer = combineReducers({ settings, com });

export default function reducer(state, action) {
    return combinedReducer(state, action);
}
