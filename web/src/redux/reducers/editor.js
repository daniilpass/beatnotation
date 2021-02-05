import {SET_REALTIME_RENDER} from '../types'

const initialState = {
    realtimeRender: true
}

export default function editorReducer(state = initialState, action) {
    console.log("store reducer", action, state);
    switch (action.type) {
        case SET_REALTIME_RENDER:
            return setRealtimeRender(state, action.payload);
        default:
            return state;
    }
}

function setRealtimeRender(state, payload) {
    return {...state, realtimeRender: payload.realtimeRender};
}