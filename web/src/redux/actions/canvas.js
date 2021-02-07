import {RENDER_NOTES, PRINT_NOTES} from "../types"

export const renderNotes = () => {
    return {
        type: RENDER_NOTES
    }
}

export const printNotes = () => {
    return {
        type: PRINT_NOTES
    }
}
