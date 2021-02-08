import React from "react";
import axios from 'axios';

import * as PlayerStates from "../../../redux/dictionary/playerStates";

export default class TracksPlayer extends React.Component {
    constructor(props) {
      super(props)

      //Player vars
      this.timerId = 0;
      this.stepDelay = 20;
      this.prevNoteIndex = -1;

      //Init AudioContext
      this.soundBuffer = [];
      this.audioCtx = this.initAudioContext();
    }
  
    componentDidMount () {
        this.initSoundBuffer();
    }

    componentDidUpdate(prevProps) {
        //PLAY STATE
        if (this.props.playerState === PlayerStates.PLAY && prevProps.playerState  !== PlayerStates.PLAY) 
        {
            console.log("PLAY NOW")    
            this.timerId = setInterval(this.step, this.stepDelay);
            this.startAllUserAudio(this.props.baseTime / 1000);
        } 
        else if (this.props.playerState === PlayerStates.STOP && prevProps.playerState  !== PlayerStates.STOP) 
        {
            console.log("STOP NOW")  
            clearInterval(this.timerId);
            this.stopAllUserAudio();
        } 
        else if (this.props.playerState === PlayerStates.PAUSE && prevProps.playerState  !== PlayerStates.PAUSE)
        {
            console.log("PAUSE NOW")  
            clearInterval(this.timerId);
            this.stopAllUserAudio();
        }

        if (this.props.loader.buffer !== prevProps.loader.buffer ) {
            this.loadUserAudio(this.props.loader.trackIndex, this.props.loader.buffer);
        }

        //Идет проигрышь и изменилось базовое время(предвинули указатель времени) или сдвинулись аудио дорожки, то запустим треки с нужного отрезка
        if ((this.props.baseTimeUpdated !== prevProps.baseTimeUpdated || this.props.audioTracksPositionChanged !== prevProps.audioTracksPositionChanged) && this.props.playerState === PlayerStates.PLAY) {
            this.stopAllUserAudio();
            let offset = this.props.baseTime + (Date.now() - this.props.playerStartedAt)
            this.startAllUserAudio(offset / 1000);
        }
    }

    initAudioContext() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        return new AudioContext();
    }

    initSoundBuffer() {
        this.props.tracks.forEach( (_track, trackIndex) => {
            //Init empty item
            this.soundBuffer[trackIndex] = {};      

            if (_track.type === 0) {
                return;
            }

            this.loadAudioSample(_track.audioUrl, audioBuffer => {
                    this.setSoundBufferForTrack(trackIndex, audioBuffer);
                })      
        });
    }

    loadAudioSample = (url, callback) => {
        //console.log("Loading sample", url);
        axios.get(url, {responseType: 'arraybuffer'})
            .then(response => {
                this.audioCtx.decodeAudioData(response.data, callback, (e) => { console.log("decodeAudioData failed", e); });
            })   
    }  

    loadUserAudio(trackIndex, arrayBuffer) {        
        console.log("===> Player. Load user audio...")
        this.props.setTrackLoaded(trackIndex, false);
        this.audioCtx.decodeAudioData(arrayBuffer.slice(0), 
            audioBuffer => {
                this.setSoundBufferForTrack(trackIndex, audioBuffer, {audio: true});
                this.props.setTrackLoaded(trackIndex, true, arrayBuffer.slice(0));
            }, 
            error => { console.log("decodeAudioData failed", error); }
        );
    }

    setSoundBufferForTrack = (trackIndex, audioBuffer, props) => {
        this.soundBuffer[trackIndex] = {...props}; 
        //save audio buffer
        this.soundBuffer[trackIndex].audioBuffer = audioBuffer;

        //save gain node for track
        this.soundBuffer[trackIndex].gainNode = this.audioCtx.createGain()              
        this.soundBuffer[trackIndex].gainNode.connect(this.audioCtx.destination)
        //console.log("Sample loaded", _track.audioUrl);

        //Оказывается так нельзя
        //Пользовательский звук создается всегда один раз
        // if (this.soundBuffer[trackIndex].audio) {
        //     let item = this.soundBuffer[trackIndex];
        //     let source = this.audioCtx.createBufferSource();
        //     source.buffer = item.audioBuffer;
        //     source.connect(item.gainNode);
        //     item.source = source;
        // }
    }

    // PLAY CYCLES
    //TODO: при перемотке на последнюю ноту -она не играется
    step = () => {
        // console.log("step", this.props.playerStartedAt);
        this.playNotes();

        //CALLBACK
        this.props.onStep && this.props.onStep();

        //Pause then end
        if(this.timelineNote > this.props.tracksLengthInNotes)
        {
            this.props.setPlayerState(PlayerStates.PAUSE);  
            this.props.setEndOfTrack(true);
        }
    }

    playNotes = () => {    
        let noteIndex = Math.trunc(this.timelineNote);
    
        if (noteIndex === this.prevNoteIndex)
            return;
        
        let taktIndex = Math.trunc(this.timelineTakt)
        let noteIndexInTakt = noteIndex % this.props.notesInTakt;

        if (taktIndex + 1> this.props.tracksLengthInTakts) {
            return;
        }

        //console.log('playNotes', taktIndex,noteIndexInTakt);

        //console.log(noteIndex);
        for (let trackIndex = 0; trackIndex < this.props.tracks.length; trackIndex++) {
            if ( this.props.tracks[trackIndex].type === 0) {
                continue;
            }

            const track = this.props.tracks[trackIndex];
            const takt = track.takts[taktIndex];
            if (takt.notes[noteIndexInTakt] > 0) {
                this.playTrackSound(trackIndex);
            }
        }    

        this.prevNoteIndex = noteIndex;
    }

    playTrackSound(trackIndex) {
        //set gain
        this.soundBuffer[trackIndex].gainNode.gain.value = this.props.tracks[trackIndex].volume; 
        // play sound
        let source = this.audioCtx.createBufferSource();
        source.buffer = this.soundBuffer[trackIndex].audioBuffer;
        source.connect(this.soundBuffer[trackIndex].gainNode);
        source.start();
    } 

    startAllUserAudio(offset) { 
        this.soundBuffer.forEach((item, trackIndex) => {
            if (!!item.audioBuffer && item.audio) {              
                let  whenInPx    = this.props.tracks[trackIndex].offset
                let  whenInSec = whenInPx / ( this.props.bpms * this.props.notesInPartCount *  this.props.noteWidth) / 1000;
               
                whenInSec = whenInSec - offset;                
                if (whenInSec >= 0) {
                    offset = 0;
                } else {        
                    offset = -whenInSec;                                
                    whenInSec = 0;
                }

                item.gainNode.gain.value = this.props.tracks[trackIndex].volume;  
                let source = this.audioCtx.createBufferSource();
                source.buffer = item.audioBuffer;
                source.connect(item.gainNode);
                source.start(this.audioCtx.currentTime + whenInSec,offset);
                item.state = "play";
                item.source = source;
            }
        });
    }

    stopAllUserAudio() {
        this.soundBuffer.forEach((item, trackIndex) => {
            if (!!item.audioBuffer && item.audio && item.state ==="play" ) {
                item.state = "stop";
                item.source.stop();
            }
        });
    }

    //TODO: дубликат когда и editor.js ((
    get timestamp() {
        if (this.props.playerState === PlayerStates.STOP || this.props.playerState === PlayerStates.PAUSE) {
            return this.props.baseTime
        } else {
            return this.props.baseTime + (Date.now() - this.props.playerStartedAt);
        }    
    }

    get timelineNote() {
        return this.timestamp * this.props.bpms * this.props.notesInPartCount;
    }

    get timelineTakt() {
        return this.timelineNote / this.props.notesInTakt;
    }

    render() {
        return false;
    }
}