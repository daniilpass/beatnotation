
import axios from 'axios';

import {audioBufferToWave} from "../utils/audioUtils";

class AudioSercive {
    constructor(){
        this.createdAt = Date.now();        

        //Init AudioContext
        this.soundBuffer = [];
        this.audioCtx = this.initAudioContext();
        this.resumed = false;
    }

    // Инициализация AudioContext
    initAudioContext() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        return new AudioContext();
    }

    // Проверить состояние контекста и при необходимости возобновить его, а затем выполнить действие
    enshureAudioContextBeforeAction = (action) => {
        if (this.resumed === false) {
            this.resumed = true;
            this.audioCtx.resume().then(action);
        } else {
            action();
        }   
    }
    
    ///
    /// Загрузка аудио данных в память
    ///
    loadAudioSampleFromUrl = (trackIndex, url, onSuccess, onError) => {
        axios.get(url, {responseType: 'arraybuffer'})
            .then(response => {
                this.decodeAudioSample(trackIndex, response.data, onSuccess, onError);
            })
            .catch(error => {
                console.log("loadAudioSample failed", error); 
                onError && onError();
            });   
    } 

    loadAudioSample = (trackIndex, audioData, onSuccess, onError) => {
        this.decodeAudioSample(trackIndex, audioData, onSuccess, onError);
    } 
 
    decodeAudioSample = (trackIndex, audioData, onSuccess, onError) => {
        this.audioCtx.decodeAudioData(audioData, 
            (decodedData) => {
                this.setSoundBufferForTrack(trackIndex, decodedData, onSuccess, onError);
            }, 
            (error) => { 
                console.log("decodeAudioData failed", error); 
                onError && onError();
            }
        );
    }

    setSoundBufferForTrack = (trackIndex, audioBuffer, onSuccess, onError) => {
        try {
            this.soundBuffer[trackIndex] = {}; 
            this.soundBuffer[trackIndex].audioBuffer = audioBuffer;
            this.soundBuffer[trackIndex].gainNode = this.audioCtx.createGain();              
            this.soundBuffer[trackIndex].gainNode.connect(this.audioCtx.destination);
            onSuccess && onSuccess();
        } catch (error) {
            console.log("setSoundBufferForTrack failed", error); 
            onError && onError();
        }        
    }

    //
    // Функции проигрывания
    //
    playSample(trackIndex, volume, when = 0, offset = 0) {
        this.enshureAudioContextBeforeAction(() => {
            let item = this.soundBuffer[trackIndex];
            //set gain
            item.gainNode.gain.value = volume;
            // play sound
            item.source = this.audioCtx.createBufferSource();
            item.source.buffer = item.audioBuffer;
            item.source.connect(item.gainNode);
            item.source.start(this.audioCtx.currentTime + when, offset);
        });        
    }

    stopSample(trackIndex) {
        let item = this.soundBuffer[trackIndex];
        if (!!item && !!item.source) {
            item.source.stop();
        }
    }

    updateSampleVolume(trackIndex, volume) {
        let item = this.soundBuffer[trackIndex];
        if (!!item && !!item.gainNode) {
            item.gainNode.gain.value = volume;
        }
    }

    //
    // WAV Export
    //
    exportToWav = (tracks, settings, onProgresss, onSuccess, onError) => { //TODO: implement onError
        // Параметры микс буфера
        let channels = 2;
        let sampleRate = this.audioCtx.sampleRate;

        // Вычисляю длину микс трека
        let mixLengthInSec = settings.tracksLengthInNotes / settings.notesInPartCount / (settings.bpm / 60);

        // Вычисляю размер микс буфреа
        let mixLength = Math.round(sampleRate * mixLengthInSec);

        // Создаю микс буффер
        let mixBuffer = this.audioCtx.createBuffer(channels, mixLength, sampleRate);

        this.exportToWavProcessChunk(16000, 0,0, channels, sampleRate, mixBuffer, mixLength, tracks, settings, onProgresss,
            () => {
                // Генерация wave файла
                let waveBlob = audioBufferToWave(mixBuffer, mixLength)

                //TODO: convert to mp3
                onSuccess && onSuccess(waveBlob);
            }
        );  
    }    

    exportToWavProcessChunk = (maxStepInFrame, channelIndex, curSampleIndex, channels, sampleRate, mixBuffer, mixLength, tracks, settings, onProgresss, onFinished) => {
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
                        this.writeTrackSampleToBuffer(trackIndex, sampleIndex, sampleRate, mixLength, mixBufferChannelData, tracks, channel, settings);
                    }                    
                }

                chunkCounter++;
                if (chunkCounter > maxStepInFrame) {
                    let progress = Math.trunc((sampleIndex / (mixLength * channels)) * 100 + (channel === 1 ? 50 : 0))
                    onProgresss && onProgresss(progress);

                    window.requestAnimationFrame(() => {
                        this.exportToWavProcessChunk(maxStepInFrame, channel, sampleIndex, channels, sampleRate, mixBuffer, mixLength, tracks, onFinished)
                    });
                    
                    return;
                }
            } 
              
            curSampleIndex = 0;
        }   

        onFinished();  
    }

    writeTrackSampleToBuffer = (trackIndex, sampleIndex, sampleRate, mixLength, mixBufferChannelData, tracks, channelIndex, settings) => {  
        // Трек для чтения
        let track = tracks[trackIndex];

        // Временные метки
        let timestamp = (sampleIndex / sampleRate) * 1000; // sample to ms timesatmp
        let noteIndex = Math.trunc(timestamp * settings.bpms * settings.notesInPartCount); // timestamp  to note index
        let taktIndex = Math.trunc(noteIndex / settings.notesInTakt);
        let noteInTaktIndex = noteIndex % settings.notesInTakt;
        
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
}

export default new AudioSercive();