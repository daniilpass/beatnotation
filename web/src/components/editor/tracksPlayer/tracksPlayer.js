import React from "react";
import axios from 'axios';

import * as PlayerStates from "../../../redux/dictionary/playerStates";
import {audioBufferToWave} from "../../../utils/audioUtils";

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
        this.resumed = false;
    }

    componentDidMount () {
        this.initSoundBuffer();
    }

    componentDidUpdate(prevProps) {
        // Управление воспроизведением
        if (this.props.playerState === PlayerStates.PLAY && prevProps.playerState  !== PlayerStates.PLAY) 
        {
            console.log("PLAY NOW")      
            this.enshureAudioContextBeforeAction(() => {
                this.timerId = setInterval(this.step, this.stepDelay);
                this.startAllUserAudio(this.props.baseTime / 1000);
            });            
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

        // Загрузка аудио
        if (this.props.loader.buffer !== prevProps.loader.buffer ) {
            this.props.setAppBusy(true, "Processing ...");
            this.loadUserAudio(this.props.loader.trackIndex, this.props.loader.buffer, this.props.loader.offset, () => {this.props.setAppBusy(false);});
        }

        //Идет проигрышь и изменилось базовое время(предвинули указатель времени) или сдвинулись аудио дорожки, то запустим треки с нужного отрезка
        //TODO: при изменении mute тоже перезапускать дорожки
        if ((this.props.baseTimeUpdated !== prevProps.baseTimeUpdated || this.props.audioTracksPositionChanged !== prevProps.audioTracksPositionChanged) && this.props.playerState === PlayerStates.PLAY) {
            this.stopAllUserAudio();
            let offset = this.props.baseTime + (Date.now() - this.props.playerStartedAt)
            this.startAllUserAudio(offset / 1000);
        }
        
        // Обновление уровня звука
        if (this.props.audioTracksVolumeChanged !== prevProps.audioTracksVolumeChanged && this.props.playerState === PlayerStates.PLAY) {
            this.updateAllUserAudioVolume();
        }


        // Экспорт
        if (this.props.exportAsWav !== prevProps.exportAsWav) {
            this.handleExportAsWav();
        }
    }

    enshureAudioContextBeforeAction = (action) => {
        if (this.resumed === false) {
            console.log("Resume AutioContext");
            this.resumed = true;
            this.audioCtx.resume().then(action);
        } else {
            action();
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
                    //console.log('_track.audioUrl', audioBuffer);
                    this.setSoundBufferForTrack(trackIndex, audioBuffer);
                })      
        });
    }

    loadAudioSample = (url, callback) => {
        axios.get(url, {responseType: 'arraybuffer'})
            .then(response => {
                this.audioCtx.decodeAudioData(response.data, callback, (e) => { console.log("decodeAudioData failed", e); });
            })   
    }  

    loadUserAudio(trackIndex, arrayBuffer, offset, errorCallback) {    
        this.props.setTrackLoaded(trackIndex, false, [], offset);
        this.audioCtx.decodeAudioData(arrayBuffer.slice(0), 
            audioBuffer => {
                this.setSoundBufferForTrack(trackIndex, audioBuffer, {audio: true});
                this.props.setTrackLoaded(trackIndex, true, arrayBuffer.slice(0), offset);
            }, 
            error => { console.log("decodeAudioData failed", error); errorCallback();}
        );
    }

    setSoundBufferForTrack = (trackIndex, audioBuffer, props) => {
        this.soundBuffer[trackIndex] = {...props}; 
        //save audio buffer
        this.soundBuffer[trackIndex].audioBuffer = audioBuffer;

        //save gain node for track
        this.soundBuffer[trackIndex].gainNode = this.audioCtx.createGain();              
        this.soundBuffer[trackIndex].gainNode.connect(this.audioCtx.destination);
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
        this.enshureAudioContextBeforeAction(() => {
            //set gain
            this.soundBuffer[trackIndex].gainNode.gain.value = this.props.tracks[trackIndex].isMute ? 0 : this.props.tracks[trackIndex].volume;
            // play sound
            let source = this.audioCtx.createBufferSource();
            source.buffer = this.soundBuffer[trackIndex].audioBuffer;
            source.connect(this.soundBuffer[trackIndex].gainNode);
            source.start();
        });        
    } 

    startAllUserAudio(offset) { 
        this.soundBuffer.forEach((item, trackIndex) => {
            if (!!item.audioBuffer && item.audio && this.props.tracks[trackIndex].loaded) {              
                let  whenInPx    = this.props.tracks[trackIndex].offset
                let  whenInSec = whenInPx / ( this.props.bpms * this.props.notesInPartCount *  this.props.noteWidth) / 1000;
               
                whenInSec = whenInSec - offset;                
                if (whenInSec >= 0) {
                    offset = 0;
                } else {        
                    offset = -whenInSec;                                
                    whenInSec = 0;
                }

                item.gainNode.gain.value = this.props.tracks[trackIndex].isMute ? 0 : this.props.tracks[trackIndex].volume;  
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

    updateAllUserAudioVolume() {
        this.soundBuffer.forEach((item, trackIndex) => {
            if (!!item.audioBuffer && item.audio) {
                item.gainNode.gain.value = this.props.tracks[trackIndex].isMute ? 0 : this.props.tracks[trackIndex].volume;
            }
        });
    }


    ///
    ///SAVE TO WAVE
    ///

    handleExportAsWav = () => {
        //this.props.setAppBusy(true);
        this.props.setAppBusy(true, "Processing ...");
        setTimeout(() => {this.saveFile()}, 500); //TODO: requestAnimationFrame polifill
       
    }

    saveFile = () => {
        let startTs = Date.now();
        console.log("Save file", startTs);

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

        // Параметры микс буфера
        let channels = 2;
        let sampleRate = this.audioCtx.sampleRate;

        // Вычисляю длину микс трека
        let mixLengthInSec = this.props.tracksLengthInNotes / this.props.notesInPartCount / (this.props.bpm / 60);

        // Вычисляю размер микс буфреа
        let mixLength = Math.round(sampleRate * mixLengthInSec);
        //console.log({mixLengthInSec, mixLength });

        // Создаю микс буффер
        let mixBuffer = this.audioCtx.createBuffer(channels, mixLength, sampleRate);

        this.saveFileProcessChunk(16000, 0,0, channels, sampleRate, mixBuffer, mixLength, tracks,
            () => {
                // Генерация wave файла
                let waveBlob = audioBufferToWave(mixBuffer, mixLength)

                //TODO: convert to mp3

                // Загрузка на устройство
                let filename = "BeatNotation_"+Date.now()+".wav";
                const a = document.createElement('a');
                a.href= URL.createObjectURL(waveBlob);
                a.download = filename;
                a.click();

                console.log("Download file",  Date.now()-startTs, "ms.");
                this.props.setAppBusy(false);
            }
        );        
    }

    saveFileProcessChunk = (maxStepInFrame, channelIndex, curSampleIndex, channels, sampleRate, mixBuffer, mixLength, tracks, onFinished) => {
        let chunkCounter = 0;

        // Заполнение микс буфера по канально
        for (let channel = channelIndex; channel < channels; channel++) {
            // Получаем массив данных канала из микс трека
            let mixBufferChannelData = mixBuffer.getChannelData(channel);

            // Сводим дорожки в микс трек
            for (let sampleIndex = curSampleIndex; sampleIndex < mixLength; sampleIndex++) {
                // аудио должно быть в интервале [-1.0; 1.0]
                for (let trackIndex = 0; trackIndex < tracks.length; trackIndex++) {
                    const track = tracks[trackIndex];

                    // Пропускаем заглушенные
                    if (!!track.isMute) {
                        continue;
                    }

                    if (track.type === 0) {
                        this.writeUserAudioToBuffer(trackIndex, sampleIndex, sampleRate, mixLength, mixBufferChannelData, tracks, channel);
                    } else {
                        this.writeTrackSampleToBuffer(trackIndex, sampleIndex, sampleRate, mixLength, mixBufferChannelData, tracks, channel);
                    }                    
                }

                chunkCounter++;
                if (chunkCounter > maxStepInFrame) {
                    //console.log("====> WHAIT NEXT FRAME");
                    let progress = Math.trunc((sampleIndex / (mixLength * channels)) * 100 + (channel === 1 ? 50 : 0))
                    this.props.setAppBusy(true, "Processing "+progress+"%");
                    window.requestAnimationFrame(() => {
                        this.saveFileProcessChunk(maxStepInFrame, channel, sampleIndex, channels, sampleRate, mixBuffer, mixLength, tracks, onFinished)
                    });
                    // setTimeout(()=>{
                    //     window.requestAnimationFrame(() => {
                    //         this.saveFileProcessChunk(maxStepInFrame, channel, sampleIndex, channels, sampleRate, mixBuffer, mixLength, tracks, onFinished)
                    //     });
                    // },50)
                    
                    return;
                }
            } 
              
            curSampleIndex = 0;
        }   

        onFinished();  
    }

    writeTrackSampleToBuffer = (trackIndex, sampleIndex, sampleRate, mixLength, mixBufferChannelData, tracks, channelIndex) => {  
        // Трек для чтения
        let track = tracks[trackIndex];

        // Временные метки
        let timestamp = (sampleIndex / sampleRate) * 1000; // sample to ms timesatmp
        let noteIndex = Math.trunc(timestamp * this.props.bpms * this.props.notesInPartCount); // timestamp  to note index
        let taktIndex = Math.trunc(noteIndex / this.props.notesInTakt);
        let noteInTaktIndex = noteIndex % this.props.notesInTakt;
        
        // Значение ноты (есть, нет, обработана)
        let noteValue = track.takts[taktIndex].notes[noteInTaktIndex];

        // Если нота обработана для канала или не звучит, то  выхожу
        if ("-9" + channelIndex === noteValue || noteValue === 0) {
            return;
        }

        //Звук
        let volume = track.volume;

        // Запись аудио буфера в микс
        this.writeTrackBufferToOutputBuffert(trackIndex, sampleIndex, mixLength, channelIndex, mixBufferChannelData, volume);

        // Флаг, что дорожка обработана
        track.takts[taktIndex].notes[noteInTaktIndex] = "-9"+channelIndex;
    }

    writeUserAudioToBuffer = (trackIndex, sampleIndex, sampleRate, mixLength, mixBufferChannelData, tracks, channelIndex) => {  
        // Трек для чтения
        let track = tracks[trackIndex];

        if (!track.loaded) {
            return;
        }

        // Проверка, что дорожка не была обработана ранее или без звука
        if ("-9" + channelIndex === track.processed || (!!this.soundBuffer[trackIndex].audio === false) ) {
            return;
        }

        // Временные метки
        let timestamp = (sampleIndex / sampleRate) * 1000; // sample to ms timesatmp

        // Если трэк еще не должен звучать, то выхожу
        if (timestamp < track.offset) {
            return;
        }

        //Звук
        let volume = track.volume;

        // Запись аудио буфера в микс
        this.writeTrackBufferToOutputBuffert(trackIndex, sampleIndex, mixLength, channelIndex, mixBufferChannelData, volume);

        // Флаг, что дорожка обработана
        track.processed = "-9"+channelIndex; // Т.к. аудиодорожка одна на трек, то флаг общий для всего трека
    }

    writeTrackBufferToOutputBuffert (trackIndex, sampleIndex, mixLength, channelIndex, mixBufferChannelData, volume) {
        //Определяю input канал
        let inputChannel = 0;
        if (channelIndex + 1 <= this.soundBuffer[trackIndex].audioBuffer.numberOfChannels) {
            inputChannel = channelIndex;
        }

        // Буффер трэка
        let trackBufferData = this.soundBuffer[trackIndex].audioBuffer.getChannelData(inputChannel);

        // Запись в микс буфер
        let trackBufferLength = trackBufferData.length;
        if (sampleIndex + trackBufferLength > mixLength) {
            trackBufferLength = mixLength - sampleIndex; //Избегаем переполнения исходного буфера
        }

        for (let trackSampleIndex = 0; trackSampleIndex < trackBufferLength; trackSampleIndex++) {
            let value = mixBufferChannelData[sampleIndex + trackSampleIndex];
            value = value + trackBufferData[trackSampleIndex] * volume;

            if (value > 1) {
                value = 1;
            }
            if (value < -1){
                value = -1;
            }
            
            mixBufferChannelData[sampleIndex + trackSampleIndex] = value;
        }
    }

    ///
    /// GETTERS
    ///
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