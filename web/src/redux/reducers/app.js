import {SET_APP_BUSY} from "../types"

const initialState = {
    busy: false
}

export default function appReducer(state = initialState, action) {    
    switch (action.type) {
        case SET_APP_BUSY:
            return setAppBusy(state, action.payload);
        default:
            return state;
    }
}

function setAppBusy(state, payload) {
    return {
        ...state,
        busy: payload.busy
    }
}