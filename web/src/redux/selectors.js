import * as PlayerStates from "./dictionary/playerStates";

export const CanPlay = state => {
    return (state.editor.playerState === PlayerStates.STOP || state.editor.playerState === PlayerStates.PAUSE) && (!state.editor.endOfTrack);
    //this.timelineNote >= this.tracksLengthInNotes
}

export const CanStop = state => {
    return true;
}

export const CanPause = state => {
    return state.editor.playerState === PlayerStates.PLAY;
}

export const CanPrint = state => {
    return state.editor.playerState === PlayerStates.STOP || state.editor.playerState === PlayerStates.PAUSE;
}

export const CanSave = state => {
    return state.editor.playerState === PlayerStates.STOP || state.editor.playerState === PlayerStates.PAUSE;
}

export const CanLoad = state => {
    return state.editor.playerState === PlayerStates.STOP || state.editor.playerState === PlayerStates.PAUSE;
}

export const GetBpms = state => {
    return state.editor.bpm / 60 / 1000;
}