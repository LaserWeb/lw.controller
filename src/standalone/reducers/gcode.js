export const GCODE_INITIALSTATE = {
    content: '',
}

export function gcode(state = GCODE_INITIALSTATE, action) {
    if (action.type === 'GCODE_SET')
        return { ...state, dirty: false, content: action.payload };
    else
        return state;
}
