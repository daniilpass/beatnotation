import {SET_REALTIME_RENDER, SET_PLAYER_STATE, SET_PLAYBACK_NOTES, SET_BPM, SET_TIME_SIGNATURE 
,INIT_TRACKS
,TAKT_COPY, TAKT_PASTE, TAKT_CLEAR, TAKT_DELETE, TAKT_ADD
,LOAD_TRACKS, SET_END_OF_TRACK, SET_TRACK_VOLUME, SET_BASETIME
,SET_TRACK_LOADED, SET_TRACK_OFFSET } from '../types'


export const setPlayerState = (value) => {
    return {
        type: SET_PLAYER_STATE,
        payload: {
            playerState: value
        }
    }
}

export const setRealtimeRender = (value) => {
    return {
        type: SET_REALTIME_RENDER,
        payload: {
            realtimeRender: value
        }
    }
}

export const setPlaybackNotes = (value) => {
    return {
        type: SET_PLAYBACK_NOTES,
        payload: {
            playbackNotes: value
        }
    }
}

export const setBpm = (value) => {
    return {
        type: SET_BPM,
        payload: {
            bpm: value
        }
    }
}

export const setTimeSignature = (value) => {
    return {
        type: SET_TIME_SIGNATURE,
        payload: {
            timeSignature: value
        }
    }
}

export const initTracks = () => {
    return {
        type: INIT_TRACKS
    }
}

export const loadTracks = (data) => {
    return {
        type: LOAD_TRACKS,
        payload:{
            data: data
        }
    }
}

export const taktCopy = (index) => {
    return {
        type: TAKT_COPY,
        payload: {
            index: index
        }
    }
}

export const taktPaste = (index) => {
    return {
        type: TAKT_PASTE,
        payload: {
            index: index
        }
    }
}

export const taktClear = (index) => {
    return {
        type: TAKT_CLEAR,
        payload: {
            index: index
        }
    }
}

export const taktDelete = (index) => {
    return {
        type: TAKT_DELETE,
        payload: {
            index: index
        }
    }
}

export const taktAdd = () => {
    return {
        type: TAKT_ADD
    }
}

export const setEndOfTrack = (value) => {
    return {
        type: SET_END_OF_TRACK,
        payload: {
            endOfTrack: value
        }
    }
}

export const setTrackVolume = (index, value) => {
    return {
        type: SET_TRACK_VOLUME,
        payload: {
            index: index,
            volume: value            
        }
    }
}

export const setBaseTime = (value, playerStartedAt) => {
    return {
        type: SET_BASETIME,
        payload: {
            baseTime: value,
            playerStartedAt: playerStartedAt
        }
    }
}

export const setTrackLoaded = (index, value, audioBuffer) => {
    return {
        type: SET_TRACK_LOADED,
        payload: {
            index: index,
            loaded: value,
            audioBuffer: audioBuffer
        }
    }
}

export const setTrackOffset = (index, value) => {
    return {
        type: SET_TRACK_OFFSET,
        payload: {
            index: index,
            offset: value
        }
    }
}
