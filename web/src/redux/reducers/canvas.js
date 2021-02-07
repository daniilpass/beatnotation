import {RENDER_NOTES, PRINT_NOTES} from "../types"

const initialState = {
    renderTime: 0,
    printTime: 0,
}

export default function canvasReducer(state = initialState, action) {    
    switch (action.type) {
        case RENDER_NOTES:
            return renderNotes(state);
        case PRINT_NOTES:
            return printNotes(state);
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

function printNotes(state) {
    return {
        ...state,
        printTime: Date.now()
    }
}