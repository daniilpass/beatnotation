import {LOAD_USER_AUDIO} from "../types"

const initialState = {
    trackIndex: -1,
    buffer: [],
}

export default function loaderReducer(state = initialState, action) {    
    switch (action.type) {
        case LOAD_USER_AUDIO:
            return loadUserAudio(state, action.payload);
        default:
            return state;
    }
}

function loadUserAudio(state, payload) {
    return {
        ...state,
        trackIndex: payload.trackIndex,
        buffer: payload.buffer,
        offset: payload.offset || 0
    }
}