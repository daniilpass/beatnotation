import React from "react";

import AudioService from "../../../services/AudioService";
import * as PlayerStates from "../../../redux/dictionary/playerStates";
import { saveFile } from "../../../utils/fileSaver";

export default class TracksPlayer extends React.Component {
    constructor(props) {
        super(props)

        //Player vars
        this.timerId = 0;
        this.stepDelay = 20;
        this.prevNoteIndex = -1;
    }

    componentDidMount () {
        this.initSoundBuffer();
    }

    componentDidUpdate(prevProps) {
        // Управление воспроизведением
        if (this.props.playerState === PlayerStates.PLAY && prevProps.playerState  !== PlayerStates.PLAY) 
        {
            this.handlePlay()
        } 
        else if (this.props.playerState === PlayerStates.STOP && prevProps.playerState  !== PlayerStates.STOP) 
        {
            this.handleStop();
        } 
        else if (this.props.playerState === PlayerStates.PAUSE && prevProps.playerState  !== PlayerStates.PAUSE)
        {
            this.handlePause();
        }

        //Идет проигрышь и изменилось базовое время(предвинули указатель времени) или сдвинулись аудио дорожки, то запустим треки с нужного отрезка
        if ((this.props.baseTimeUpdatedAt !== prevProps.baseTimeUpdatedAt || this.props.audioTracksPositionChangedAt !== prevProps.audioTracksPositionChangedAt) && this.props.playerState === PlayerStates.PLAY) {
            this.handleAudioPositionChangeWhilePlaying();
        }
        
        // Обновление уровня звука
        if (this.props.audioTracksVolumeChangedAt !== prevProps.audioTracksVolumeChangedAt && this.props.playerState === PlayerStates.PLAY) {
            this.handleAudioVolumeChangeWhilePlaying();
        }

        // Загрузка аудио
        if (this.props.loader.buffer !== prevProps.loader.buffer ) {
            this.hanldeLoadAudio();
        }

        // Экспорт аудио
        if (this.props.exportAsWavAt !== prevProps.exportAsWavAt) {
            this.handleExportAsWav();
        }
    }

    //
    // Init sound buffers
    //
    initSoundBuffer() {
        this.props.tracks.forEach( (_track, trackIndex) => {
            if (_track.type === 0) 
                return;
            AudioService.loadAudioSampleFromUrl(trackIndex, _track.audioUrl);      
        });
    }

    //
    // Handle player and editor shanges
    //
    handlePlay = () => {   
        this.timerId = setInterval(this.step, this.stepDelay);
        this.startAllUserAudio(this.props.baseTime / 1000);
    }

    handleStop = () => {   
        clearInterval(this.timerId);
        this.stopAllNotes();
        this.stopAllUserAudio();
    }

    handlePause = () => {   
        clearInterval(this.timerId);
        this.stopAllNotes();
        this.stopAllUserAudio();
    }

    handleAudioPositionChangeWhilePlaying = () => {
        this.stopAllNotes();
        this.stopAllUserAudio();
        let offset = this.props.baseTime + (Date.now() - this.props.playerStartedAt)
        this.startAllUserAudio(offset / 1000);
    }

    handleAudioVolumeChangeWhilePlaying = () => {
        this.updateAllUserAudioVolume();
    }

    hanldeLoadAudio = () => {
        // vars
        let trackIndex = this.props.loader.trackIndex;
        let arrayBuffer = this.props.loader.buffer;
        let offset = this.props.loader.offset;

        // Busy and reset track
        this.props.setAppBusy(true, "Processing ...");
        this.props.setTrackLoaded(trackIndex, false, [], 0);
        
        // calbacks
        let onSuccess = () => { this.props.setTrackLoaded(trackIndex, true, arrayBuffer.slice(0), offset) };
        let onError = () => { this.props.setAppBusy(false); }

        // loading
        AudioService.loadAudioSample(trackIndex, arrayBuffer.slice(0), onSuccess, onError);
    }

    handleExportAsWav = () => {
        this.props.setAppBusy(true, "Processing ...");
        setTimeout(() => {this.exportToWavAndDownload()}, 500);   
    }

    //
    // Audio Player step
    //
    step = () => {
        // console.log("step", this.props.playerStartedAt);
        this.playNotes();

        //CALLBACK
        this.props.onStep && this.props.onStep();
        
        //Loop
        if (this.props.loop && this.timestamp >= this.props.loopEnd){
            //this.props.setEndOfTrack(false);
            this.props.setBaseTime(Math.ceil(this.props.loopStart), Date.now());  
            return;
        }

        //Pause then end
        if(this.timelineNote > this.props.tracksLengthInNotes)
        {
            this.props.setPlayerState(PlayerStates.PAUSE);  
            this.props.setEndOfTrack(true);
            return;
        }
    }

    //
    // Simple notes plaing
    //
    playNotes = () => {    
        let noteIndex = Math.trunc(this.timelineNote);
    
        if (noteIndex === this.prevNoteIndex)
            return;

        this.prevNoteIndex = noteIndex;

        // Такт и нота в данный момент времени
        let taktIndex = Math.trunc(this.timelineTakt)
        let noteIndexInTakt = noteIndex % this.props.notesInTakt;

        if (taktIndex >= this.props.tracksLengthInTakts) {
            return;
        }

        // На самом деле играем не текущую ноту, а планируем проиграть следующую, что увеличиват плавность и точность вопсроизведения
        let nextNoteIndex = noteIndex + 1;
        let nextNoteIndexInTakt = noteIndexInTakt + 1;
        if (nextNoteIndexInTakt >= this.props.notesInTakt) {
            taktIndex = taktIndex + 1;
            nextNoteIndexInTakt = 0;
        }
        noteIndexInTakt = nextNoteIndexInTakt;

        // Избегаем переполнения
        if (taktIndex >= this.props.tracksLengthInTakts || noteIndexInTakt >= this.props.tracksLengthInNotes) {
            return;
        }

        let whenNoteShouldPlay = nextNoteIndex / (this.props.bpms * this.props.notesInPartCount);
        let when = (whenNoteShouldPlay - this.timestamp) / 1000;

        for (let trackIndex = 0; trackIndex < this.props.tracks.length; trackIndex++) {
            // Пропускаю аудио дорожки, их проигрывание идет отдельно
            if ( this.props.tracks[trackIndex].type === 0) {
                continue;
            }

            const track = this.props.tracks[trackIndex];
            const takt = track.takts[taktIndex];
            const volume = track.isMute ? 0 : track.volume;
            if (takt.notes[noteIndexInTakt] > 0 && volume > 0) {
                AudioService.playSample(trackIndex, volume, when, 0); 
            }
            //HACK: Если текущаю нота самая первая, то проиграю её сразу, т.к. запланировать её нельзя
            if (noteIndex === 0 && takt.notes[noteIndexInTakt - 1] > 0 && volume > 0) {
                AudioService.playSample(trackIndex, volume, 0, 0); 
            }
        }    
    }

    stopAllNotes() {
        for (let trackIndex = 0; trackIndex < this.props.tracks.length; trackIndex++) {
            // Обрабатываю только загруженные аудио дорожки
            if (this.props.tracks[trackIndex].type === 0) {
                continue;
            }

            AudioService.stopSample(trackIndex); 
        }
    }
    
    //
    // User audio playing
    //
    startAllUserAudio(offset) { 
        for (let trackIndex = 0; trackIndex < this.props.tracks.length; trackIndex++) {
            // Обрабатываю только загруженные аудио дорожки
            if (this.props.tracks[trackIndex].type !== 0 || this.props.tracks[trackIndex].loaded === false) {
                continue;
            }

            // Рассчитываю время начала и смещения
            let  whenInSec = this.props.tracks[trackIndex].offset / 1000;
           
            whenInSec = whenInSec - offset;                
            if (whenInSec >= 0) {
                offset = 0;
            } else {        
                offset = -whenInSec;                                
                whenInSec = 0;
            }

            const volume = this.props.tracks[trackIndex].isMute ? 0 : this.props.tracks[trackIndex].volume; 
            AudioService.playSample(trackIndex, volume, whenInSec, offset); 
        }
    }

    stopAllUserAudio() {
        for (let trackIndex = 0; trackIndex < this.props.tracks.length; trackIndex++) {
            // Обрабатываю только загруженные аудио дорожки
            if (this.props.tracks[trackIndex].type !== 0) {
                continue;
            }

            AudioService.stopSample(trackIndex); 
        }
    }

    updateAllUserAudioVolume() {
        for (let trackIndex = 0; trackIndex < this.props.tracks.length; trackIndex++) {
            // Обрабатываю только загруженные аудио дорожки
            if (this.props.tracks[trackIndex].type !== 0) {
                continue;
            }
            const volume = this.props.tracks[trackIndex].isMute ? 0 : this.props.tracks[trackIndex].volume
            AudioService.updateSampleVolume(trackIndex, volume); 
        }
    }

    ///
    ///SAVE TO WAVE
    ///

    exportToWavAndDownload = () => {
        // Данные для обработки (копия трэков)
        let tracks = [...this.props.tracks];

        tracks.forEach( (track, index) => {
            let tmpTrack = {...track};

            if (tmpTrack.type === 0) {
                return;
            }

            tmpTrack.takts = [...track.takts];
            tmpTrack.takts.forEach( (_takt, index) => {
                let tmpTakt = {..._takt}
                tmpTakt.notes = [..._takt.notes];
                tmpTrack.takts[index] = tmpTakt;
            });
            tracks[index] = tmpTrack;
        });

        // Параметры редактора
        let settings = {
            bpm: this.props.bpm,
            bpms: this.props.bpms,
            notesInPartCount: this.props.notesInPartCount,
            notesInTakt: this.props.notesInTakt,
            tracksLengthInNotes: this.props.tracksLengthInNotes,
            noteWidth: this.props.noteWidth,
            loop: this.props.exportOnlySelection,
            loopStart: this.props.loopStart,
            loopEnd: this.props.loopEnd,
        }

        // Экспорт
        AudioService.exportToWav(tracks, settings, this.handleExportProgress, this.handleExportSuccess);
    }

    handleExportProgress = (progress) => {
        this.props.setAppBusy(true, "Processing "+progress+"%");
    }

    handleExportSuccess = (waveBlob) => {
        this.props.setAppBusy(false);
        saveFile(waveBlob, `${this.props.projectName}.wav`);
    }    

    ///
    /// GETTERS
    ///
    //TODO: дубликат кода из editor.js ((
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