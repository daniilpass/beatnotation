import {SET_REALTIME_RENDER, SET_PLAYER_STATE, SET_PLAYBACK_NOTES, SET_BPM, SET_TIME_SIGNATURE
    //,INIT_TRACKS
    ,TAKT_COPY, TAKT_PASTE, TAKT_CLEAR, TAKT_DELETE, TAKT_ADD
    ,LOAD_TRACKS, SET_END_OF_TRACK, SET_TRACK_VOLUME, SET_BASETIME
    ,SET_TRACK_LOADED, SET_TRACK_OFFSET, SET_TRACK_MUTE
    ,EXPORT_AS_WAV, CLEAR_TRACK, SET_LOOP_PERIOD, SET_LOOP, SCROLL_WORKSPACE
    ,SET_GO_TO_START_AFTER_STOP,
    SET_PROJECT_NAME
} from '../types'

import {tracksData} from "../../assets/data/tracksData";
import * as PlayerState from "../dictionary/playerStates";

const defaultProjectName = `BeatNotation_Untitled`;

const initialState = {
    //project
    projectName: defaultProjectName,
    //Track settings
    playerState: "stop",
    baseTime: 0,
    baseTimeUpdatedAt: 0,
    playerStartedAt: 0, 
    playerStoppedAt: 0, 
    endOfTrack: false,
    bpm: 120,
    timeSignature: [4,4],
    notesInPartCount: 4, //Кол-во нот за один удар метронома. Их всегда 4 (играем 16ми нотами, а один удар метронома = одной четверти)
    notesInTakt: 16, 
    tracksLengthInTakts: 4,
    tracksLengthInNotes: 4 * 16,
    //Time signatures
    timeSignatures: [
        "2/4", "3/4", "4/4","6/4", "9/4",
        // "2/8", "4/8", 
        "3/8", "6/8", "9/8", "12/8",
        //"2/16","3/16",      "6/16","9/16","12/16", //TODO: выяснить группировку нот в таком размере
      ], 
    //Editor settings
    realtimeRender: true,
    playbackNotes: true,
    //loop
    loop: false,
    loopStart: 0,
    loopEnd: 2000,
    //rewind
    goToStartAfterStop: false,    
    //View settings
    noteWidth: 20,
    defaultNotewWidth: 20,
    noteHeight: 31,   
    taktControlHeight: 31, 
    minTaktControlWidth: 250,
    trackControlWidth: 300,
    addTaktButtonWidth: 100,
    timePointerWidth: 10,
    //TRAAAAAAAAAACK
    exportAsWavAt: 0,
    exportOnlySelection: false,
    audioTracksPositionChangedAt: 0,
    audioTracksVolumeChangedAt: 0,
    tracks: initTracks({tracksLengthInTakts: 4, notesInTakt: 16}), //TODO: что-то не так делаю явно
    clipboard: [],
    scroll: {
        x: 0
    }
}

export default function editorReducer(state = initialState, action) {
    // if (process.env.NODE_ENV !== 'production') {
    //     console.log("store reducer", action);
    // }
    


    switch (action.type) {
        case SET_PLAYER_STATE:
            return setPlayerState(state, action.payload);
        case SET_REALTIME_RENDER:
            return setRealtimeRender(state, action.payload);
        case SET_PLAYBACK_NOTES:
            return setPlaybackNotes(state, action.payload);
        case SET_BPM:
            return setBpm(state, action.payload);
        case SET_TIME_SIGNATURE:
            return setTimeSignature(state, action.payload);
        // case INIT_TRACKS:
        //     return initTracks();
        case TAKT_COPY:
            return taktCopy(state, action.payload);
        case TAKT_PASTE:
            return taktPaste(state, action.payload);
        case TAKT_CLEAR:
            return taktClear(state, action.payload);
        case TAKT_DELETE:
            return taktDelete(state, action.payload);
        case TAKT_ADD:
            return taktAdd(state);
        case LOAD_TRACKS:
            return loadTracks(state, action.payload);
        case SET_END_OF_TRACK:
            return setEndOfTrack(state, action.payload);
        case SET_TRACK_VOLUME:
            return setTrackVolume(state, action.payload);
        case SET_BASETIME:
            return setBaseTime(state, action.payload);     
        case SET_TRACK_LOADED:
            return setTrackLoaded(state, action.payload);  
        case SET_TRACK_OFFSET:
            return setTrackOffset(state, action.payload); 
        case SET_TRACK_MUTE:
            return setTrackIsMute(state, action.payload); 
        case EXPORT_AS_WAV:
            return exportAsWav(state, action.payload); 
        case CLEAR_TRACK:
            return clearTrack(state, action.payload); 
        case SET_LOOP_PERIOD:
            return setLoopPeriod(state, action.payload);
        case SET_LOOP:
            return setLoop(state, action.payload);
        case SET_GO_TO_START_AFTER_STOP:
            return setGoToStartAfterStop(state, action.payload);
        case SCROLL_WORKSPACE:
            return scrollWorkspace(state, action.payload);
        case SET_PROJECT_NAME:
            return setProjectName(state, action.payload);
        default:
            return state;
    }
}

function setPlayerState(state, payload) {
    let newPlayerStartedAt = state.playerStartedAt;
    let newPlayerStoppedAt = state.playerStoppedAt;    
    let newBaseTime = state.baseTime;
    let newbaseTimeUpdatedAt = state.baseTimeUpdatedAt;

    let eot = state.endOfTrack; //TODO: обходное решение
    if (payload.playerState === PlayerState.STOP) {
        eot = false;   
        if (state.goToStartAfterStop) {
            newBaseTime = 0;
            newbaseTimeUpdatedAt = Date.now();
        }        
        newPlayerStoppedAt = Date.now();
    } else if (payload.playerState === PlayerState.PAUSE) {
        newPlayerStoppedAt = Date.now();
        newBaseTime = newBaseTime + Date.now() - state.playerStartedAt;
        newbaseTimeUpdatedAt = Date.now();
    } else if (payload.playerState === PlayerState.PLAY) {
        newPlayerStartedAt = Date.now();
        newPlayerStoppedAt = 0;
        if (state.loop) {
            newBaseTime = Math.ceil(state.loopStart);
            newbaseTimeUpdatedAt = Date.now();
        }
    }

    return {
        ...state, 
        playerState: payload.playerState,
        baseTime: newBaseTime,
        baseTimeUpdatedAt: newbaseTimeUpdatedAt,
        playerStartedAt: newPlayerStartedAt,
        playerStoppedAt: newPlayerStoppedAt,
        endOfTrack: eot
    };
}


function setRealtimeRender(state, payload) {
    return {...state, realtimeRender: payload.realtimeRender};
}

function setPlaybackNotes(state, payload) {
    return {...state, playbackNotes: payload.playbackNotes};
}

function setBpm(state, payload) {
    return {
        ...state, 
        bpm: payload.bpm,
        loopEnd: state.loopEnd * (state.bpm / payload.bpm),
        loopStart: state.loopStart * (state.bpm / payload.bpm),
        playerState: PlayerState.STOP,
        baseTime: 0,
        baseTimeUpdatedAt: Date.now(),
        playerStoppedAt: Date.now(),
        endOfTrack: false
    };
}

function setTimeSignature(state, payload) {
    const newTimeSignature = payload.timeSignature;

    // updateTimeSignatureRelativeProperties
    // updateNotesInTakt
    let up = newTimeSignature[0];
    let down = newTimeSignature[1]; 
    //Количество нот в долях
    let notesInPart = 0;
    switch (down) {
        case 4: notesInPart = 4; break;
        case 8: notesInPart = 2; break;
        case 16: notesInPart = 1; break;
        default:
        throw ("Unknown timeSignature:", newTimeSignature);
    }    
    //Расчет кол-ва нот в такте, новой длины трека
    const newNotesInTakt = up * notesInPart;
    
    // updateTrackLength
    const newTracksLengthInTakts = Math.ceil(state.tracksLengthInNotes / newNotesInTakt);
    const newTracksLengthInNotes = newTracksLengthInTakts * newNotesInTakt;

    // updateNotesSacle
    //Масштабируем размер нот так, чтобы помещались элементы управления такта
    let newNoteWidth = Math.ceil(state.minTaktControlWidth / newNotesInTakt);
    if (newNoteWidth < state.defaultNotewWidth) {
        newNoteWidth = state.defaultNotewWidth;
    }

    // Изменение структуры трека
    let tmpTracks = [...state.tracks]; 

    for (let i = 0; i < tmpTracks.length; i++) {
        let tmpTrack = {...tmpTracks[i]};

        if (tmpTrack.type === 0) {
            //Skip audio tracks
            tmpTracks[i] = tmpTrack;
            continue;
        }

        //Поулчаю ноты в плоском виде, чтобы легче их распихать по новым тактам
        let plainNotes = [];      
        tmpTrack.takts.forEach(takt => {
            plainNotes = plainNotes.concat(takt.notes);
        });

        //Заполняю новую структуру
        let noteCounter = 0;
        tmpTrack.takts = [];
        for (let tIdx = 0; tIdx < newTracksLengthInTakts; tIdx++) { 
            tmpTrack.ts =   Date.now()+"_"+tIdx       
            tmpTrack.takts[tIdx] = {
            ts: Date.now()+"_"+tIdx,
            notes: []
            }      
            for (let nIdx = 0; nIdx < newNotesInTakt; nIdx++) {
            tmpTrack.takts[tIdx].notes[nIdx] = plainNotes[noteCounter] || 0;  
            noteCounter++;         
            }
        }

        tmpTracks[i] = tmpTrack;      
    }

    return {
        ...state,
        timeSignature: [...newTimeSignature],
        notesInTakt: newNotesInTakt,
        noteWidth: newNoteWidth,
        tracksLengthInTakts: newTracksLengthInTakts,
        tracksLengthInNotes: newTracksLengthInNotes,
        tracks: [...tmpTracks],
        //stop player and reset to 0
        playerState: PlayerState.STOP,
        baseTime: 0,
        baseTimeUpdatedAt: Date.now(),
        playerStoppedAt: Date.now(),
        endOfTrack: false      
    };
}

function initTracks(state) {
    const tracks = [...tracksData];
    //Init empty tracks
    tracks.forEach(track => {       
        if (track.type === 0) {
            return;
        } 
        for (let tIdx = 0; tIdx < state.tracksLengthInTakts; tIdx++) { 
            track.ts =   Date.now()+"_"+tIdx       
            track.takts[tIdx] = {
                ts: Date.now()+"_"+tIdx,
                notes: []
            }      
            for (let nIdx = 0; nIdx < state.notesInTakt; nIdx++) {
                track.takts[tIdx].notes[nIdx] = 0;           
            }
        }
    });    

    return tracks;
}


function taktCopy(state, payload) {  
    let clipboard = [];

    state.tracks.forEach( (track, trackIndex) => { 
        if (track.type === 0) {
            return;
        } 
        clipboard[trackIndex] = [...track.takts[payload.index].notes];
    });

    console.log('clipboard', clipboard);
    return {...state, clipboard: clipboard};
}

function taktPaste(state, payload) {
    let tmpTracks = [...state.tracks]; 
    let taktIndex = payload.index;

    tmpTracks.forEach( (track, trackIndex) => { 
        if (track.type === 0) {
            return;
        } 

        let tmpTrack = {...tmpTracks[trackIndex]};
        tmpTrack.ts = Date.now();
        tmpTrack.takts[taktIndex] = {};
        tmpTrack.takts[taktIndex].notes = [];
        //Oops. Из буфера читаем только ноты для нашего размера такта, лишнее не берём
        for (let i = 0; i < state.notesInTakt; i++) {  
            tmpTrack.takts[taktIndex].notes[i] = state.clipboard[trackIndex][i] || 0;  
        } 
        tmpTrack.takts[taktIndex].ts = Date.now()+"_"+taktIndex;
        tmpTracks[trackIndex] = tmpTrack; 
    });

    return {
        ...state,
        tracks: [...tmpTracks]      
    };    
}

function taktClear(state, payload) {
    let tmpTracks = [...state.tracks]; 
    let taktIndex = payload.index;

    tmpTracks.forEach( (track, trackIndex) => { 
        if (track.type === 0) {
            return;
        } 

        let tmpTrack = {...tmpTracks[trackIndex]};
        tmpTrack.ts = Date.now();
        tmpTrack.takts[taktIndex] = {};
        tmpTrack.takts[taktIndex].notes = [];
        for (let i = 0; i < state.notesInTakt; i++) {  
            tmpTrack.takts[taktIndex].notes[i] = 0;  
        } 
        tmpTrack.takts[taktIndex].ts = Date.now()+"_"+taktIndex;
        tmpTracks[trackIndex] = tmpTrack; 
    });

    return {
        ...state,
        tracks: [...tmpTracks]      
    };    
}

function taktDelete(state, payload) {
    let taktIndex = payload.index;
    let newTracksLengthInTakts = state.tracksLengthInTakts - 1;
    let newTracksLengthInNotes = newTracksLengthInTakts * state.notesInTakt;

    let tmpTracks = [...state.tracks]; 

    tmpTracks.forEach( (track, trackIndex) => { 
        if (track.type === 0) {
            return;
        } 

        let tmpTrack = {...tmpTracks[trackIndex]};
        tmpTrack.ts = Date.now();
        var tmpArr = [...tmpTrack.takts];
        tmpArr.splice(taktIndex, 1)
        tmpTrack.takts = [...tmpArr]
        tmpTracks[trackIndex] = tmpTrack;
    });

    
    // Хитрые перерасчеты цикла
    let newLoopEnd = state.loopEnd;
    let newTrackLengthInMs = newTracksLengthInNotes  / (state.bpm / 60 / 1000) / state.notesInPartCount;
    if (newTrackLengthInMs < state.loopEnd) {
        newLoopEnd = newTrackLengthInMs;
    }

    let newLoopStart = state.loopStart;
    let minLoopLengthInMs = state.noteWidth * 3 / state.noteWidth / (state.bpm / 60 / 1000)  / state.notesInPartCount;
    if (newLoopEnd < state.loopStart + minLoopLengthInMs) {
        newLoopStart = newLoopEnd - minLoopLengthInMs;
    }

    if (newLoopStart < 0) {
        newLoopStart = 0;
        newLoopEnd = minLoopLengthInMs;
    }

    return {
        ...state,
        loopStart: newLoopStart,
        loopEnd: newLoopEnd,
        tracksLengthInTakts: newTracksLengthInTakts,
        tracksLengthInNotes: newTracksLengthInNotes,
        tracks: [...tmpTracks]
    };    
}

function taktAdd(state) {
    let newTracksLengthInTakts = state.tracksLengthInTakts + 1;
    let newTracksLengthInNotes = newTracksLengthInTakts * state.notesInTakt; 

    let tmpTracks = [...state.tracks]; 
    tmpTracks.forEach( (track, trackIndex) => { 
        if (track.type === 0) {
            return;
        } 

        let tmpTrack = {...tmpTracks[trackIndex]};
        tmpTrack.takts = [
            ...tmpTrack.takts,
            {
              notes: [...Array(state.notesInTakt)].map(el => {return 0}),
              ts: Date.now() + "_" +(newTracksLengthInTakts-1)
            }          
        ];
        tmpTracks[trackIndex] = tmpTrack;
    });

    return {
        ...state,
        endOfTrack: false,
        tracksLengthInTakts: newTracksLengthInTakts,
        tracksLengthInNotes: newTracksLengthInNotes,
        tracks: [...tmpTracks]      
    };   
}

function loadTracks(state, payload) {
    let data = payload.data;

    //Load from files:
    var maxTaktCount = 0;
    let tmpTracks = [...state.tracks]; 
    for (let it = 0; it < tmpTracks.length; it++) {
        const tmpTrack = {...state.tracks[it]};
        const loadedTrack = data.tracks[it];

        tmpTrack.volume = loadedTrack.volume; 
        tmpTrack.isMute = loadedTrack.isMute; 
        tmpTrack.ts = Date.now();
        if (state.tracks[it].type === 0) {
            //загрузка пользовательского трека            
            tmpTrack.arrayBuffer = null;
            tmpTrack.loaded = false;
            tmpTrack.offset = loadedTrack.offset;
        } else {
            tmpTrack.takts = [...loadedTrack.takts];
            maxTaktCount = tmpTrack.takts.length > maxTaktCount ? tmpTrack.takts.length : maxTaktCount;
        }

        tmpTracks[it] = tmpTrack;
    }

    //TODO: убрать дубликаты кода (подобие при смене сигнатуры)
    //updateNotesInTakt
    let up = data.timeSignature[0];
    let down = data.timeSignature[1]; 
    //Количество нот в долях
    let notesInPart = 0;
    switch (down) {
        case 4: notesInPart = 4; break;
        case 8: notesInPart = 2; break;
        case 16: notesInPart = 1; break;
        default:
        throw ("Unknown timeSignature:", data.timeSignature);
    }    
    //Расчет кол-ва нот в такте, новой длины трека
    const newNotesInTakt = up * notesInPart;

    //update tracks length
    const newTracksLengthInTakts = maxTaktCount;
    const newTracksLengthInNotes = newTracksLengthInTakts * newNotesInTakt;

    //updateNotesSacle
    //Масштабируем размер нот так, чтобы помещались элементы управления такта
    let newNoteWidth = Math.ceil(state.minTaktControlWidth / newNotesInTakt);
    if (newNoteWidth < state.defaultNotewWidth) {
        newNoteWidth = state.defaultNotewWidth;
    }

    return {
        ...state,
        projectName: data.projectName || defaultProjectName,
        baseTime: 0,
        newbaseTimeUpdatedAt: Date.now(),
        bpm: data.bpm,
        timeSignature: data.timeSignature,
        loop: data.loop !== undefined ? data.loop : state.loop,
        loopStart: data.loopStart!== undefined ? data.loopStart : state.loopStart,
        loopEnd: data.loopEnd!== undefined ? data.loopEnd : state.loopEnd,  
        realtimeRender: data.realtimeRender!== undefined ? data.realtimeRender : state.realtimeRender,
        playbackNotes: data.playbackNotes!== undefined ? data.playbackNotes : state.playbackNotes,
        notesInTakt: newNotesInTakt,
        tracksLengthInTakts: newTracksLengthInTakts,
        tracksLengthInNotes: newTracksLengthInNotes,
        noteWidth: newNoteWidth,
        tracks: [...tmpTracks]              
    };  
}

function setEndOfTrack(state, payload) {
    return {...state, endOfTrack: payload.endOfTrack}
}

function setTrackVolume (state, payload) { 
    let trackIndex = payload.index;
    let volume = payload.volume;

    let tmpTracks = [...state.tracks];
    let tmpTrack = {...tmpTracks[trackIndex]};
    tmpTrack.volume = volume;
    tmpTrack.ts = Date.now();
    tmpTracks[trackIndex] = tmpTrack;

    return {
        ...state,
        audioTracksVolumeChangedAt: tmpTrack.type === 0 ? Date.now() : state.audioTracksVolumeChangedAt,
        tracks: tmpTracks
    }
}

function setBaseTime(state, payload) {
    return {
        ...state, 
        playerStartedAt: payload.playerStartedAt || state.playerStartedAt,
        baseTime: payload.baseTime,
        baseTimeUpdatedAt: Date.now()
    }
}

function setTrackLoaded(state, payload) {
    let trackIndex = payload.index;
    let loaded = payload.loaded;
    let arrayBuffer = payload.arrayBuffer;
    let offset = payload.offset;

    let tmpTracks = [...state.tracks];
    let tmpTrack = {...tmpTracks[trackIndex]};
    tmpTrack.loaded = loaded;
    tmpTrack.arrayBuffer = arrayBuffer;
    tmpTrack.offset = offset || 0;
    tmpTrack.ts = Date.now();
    tmpTracks[trackIndex] = tmpTrack;

    return {
        ...state,
        tracks: tmpTracks
    }
}

function setTrackOffset(state, payload) {
    let trackIndex = payload.index;
    let offset = payload.offset;

    let tmpTracks = [...state.tracks];
    let tmpTrack = {...tmpTracks[trackIndex]};   
    tmpTrack.offset = offset;
    tmpTrack.ts = Date.now();
    tmpTracks[trackIndex] = tmpTrack;

    return {
        ...state,
        audioTracksPositionChangedAt: Date.now(),
        tracks: tmpTracks
    }
}


function setTrackIsMute (state, payload) {
    let trackIndex = payload.index;

    let tmpTracks = [...state.tracks];
    let tmpTrack = {...tmpTracks[trackIndex]};   
    tmpTrack.isMute = !tmpTrack.isMute;
    tmpTrack.ts = Date.now();
    tmpTracks[trackIndex] = tmpTrack;

    return {
        ...state,
        audioTracksVolumeChangedAt: Date.now(),
        tracks: tmpTracks
    }
}

function exportAsWav(state, payload) {
    return {
        ...state,
        exportAsWavAt: Date.now(),
        exportOnlySelection: payload.onlySelection
    }
}

function clearTrack(state, payload) {
    let trackIndex = payload.trackIndex;

    let tmpTracks = [...state.tracks];
    let tmpTrack = {...tmpTracks[trackIndex]}; 
    
    if (tmpTrack.type === 0) {
        // аудио          
        tmpTrack.arrayBuffer = null;
        tmpTrack.loaded = false;
        tmpTrack.offset = 0;
    } else {
        // ноты
        tmpTrack.takts = [...tmpTrack.takts];

        for (let taktIndex = 0; taktIndex < tmpTrack.takts.length; taktIndex++) {
            tmpTrack.takts[taktIndex] = {};
            tmpTrack.takts[taktIndex].notes = [];
            for (let nIdx = 0; nIdx < state.notesInTakt; nIdx++) {
                tmpTrack.takts[taktIndex].notes[nIdx] = 0;           
            }
            tmpTrack.takts[taktIndex].ts = Date.now()+"_"+taktIndex;
        }
    }

    tmpTrack.ts = Date.now();
    tmpTracks[trackIndex] = tmpTrack;

    return {
        ...state,
        tracks: tmpTracks,
        playerState: PlayerState.STOP, //TODO: не сбрасывать на начало трека
        baseTime: 0,
        baseTimeUpdatedAt: Date.now(),
        playerStoppedAt: Date.now(),
        endOfTrack: false
    }
}


function setLoopPeriod(state, payload) {
    return {
        ...state,
        loopStart: payload.loopStart,
        loopEnd: payload.loopEnd
    }
}

function setLoop(state, payload) {
    return {
        ...state,
        loop: payload.loop
    }
}

function setGoToStartAfterStop(state, payload) {
    return {
        ...state,
        goToStartAfterStop: payload.goToStartAfterStop
    }
}

function scrollWorkspace (state, payload) {
    return {
        ...state,
        scroll: {
            x: payload.scrollX
        }
    }
}

function setProjectName (state, payload) {
    return {
        ...state,
        projectName: payload
    }
}