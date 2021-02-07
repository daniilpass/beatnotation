import {LOAD_USER_AUDIO} from "../types"

export const loadUserAudio = (trackIndex, buffer) => {
    return {
        type: LOAD_USER_AUDIO,
        payload: {
            trackIndex: trackIndex,
            buffer: buffer
        }
    }
}
