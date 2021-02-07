import {RENDER_NOTES} from "../types"

const initialState = {
    renderTime: 0
}

export default function canvasReducer(state = initialState, action) {    
    switch (action.type) {
        case RENDER_NOTES:
            return renderNotes();
        default:
            return state;
    }
}

function renderNotes(state) {
    return {
        ...state,
        renderTime: Date.now()
    }
}