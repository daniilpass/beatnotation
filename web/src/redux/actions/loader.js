import {LOAD_USER_AUDIO} from "../types"

export const loadUserAudio = (trackIndex, buffer, offset) => {
    return {
        type: LOAD_USER_AUDIO,
        payload: {
            trackIndex: trackIndex,
            buffer: buffer,
            offset: offset
        }
    }
}