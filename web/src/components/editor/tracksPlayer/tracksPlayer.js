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
        if (this.props.playerState === PlayerStates.PLAY && prevProps.playerState  !== PlayerStates.PLAY) {
            console.log("PLAY NOW")    
            this.timerId = setInterval(this.step, this.stepDelay);
        } else if (this.props.playerState === PlayerStates.STOP && prevProps.playerState  !== PlayerStates.STOP) {
            console.log("STOP NOW")  
            clearInterval(this.timerId);
        } else if (this.props.playerState === PlayerStates.PAUSE && prevProps.playerState  !== PlayerStates.PAUSE){
            console.log("PAUSE NOW")  
            clearInterval(this.timerId);
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

        this.loadAudioSample(_track.audioUrl, audioBuffer => {
                //save audio buffer
                this.soundBuffer[trackIndex].audioBuffer = audioBuffer;

                //save gain node for track
                this.soundBuffer[trackIndex].gainNode = this.audioCtx.createGain()              
                this.soundBuffer[trackIndex].gainNode.connect(this.audioCtx.destination)
                //console.log("Sample loaded", _track.audioUrl);
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

    //TODO: дубликат когда и editor.js ((
    get timestamp() {
        if (this.props.playerState === PlayerStates.STOP || this.props.playerState === PlayerStates.PAUSE) {
            return this.props.baseTime
        } else if (this.props.playerState === PlayerStates.PLAY) {
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