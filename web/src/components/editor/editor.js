import React from "react";
import axios from 'axios';

import Track from "./track/track";
import {tracksData} from "../../assets/data/tracksData";
import UserFileReader from "../userFileReader/userFileReader";

const requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;

export default class Editor extends React.Component {
  constructor(props){
      super(props);
      
      //VARS
      this.defaultBpm = 120;
      this.notesInPartCount = 4;
      
      this.notesInTakt = 16;
      this.tracksLengthInTakts = 4;
      this.tracksLengthInNotes = this.tracksLengthInTakts * this.notesInTakt;

      this.noteWidth = 20;
      this.defaultNotewWidth = 20;
      this.noteHeight = 31;
      this.taktControlHeight = 31;
      this.minTaktControlWidth = 250;
      this.trackControlWidth = 200;
      this.addTaktButtonWidth = 100;
      this.timePointerWidth = 10;
      this.timeSignatures = [
        "2/4", "3/4", "4/4","6/4", "9/4",
        // "2/8", "4/8", 
        "3/8", "6/8", "9/8", "12/8",
        //"2/16","3/16",      "6/16","9/16","12/16", //TODO: выяснить группировку нот в таком размере
      ];

      this.timerId = 0;
      this.stepDelay = 20;
      this.prevNoteIndex = -1;
      this.prevTaktIndex = -1;
      this.timestamp = 0;
      this.playPrevTs = 0;

      this.soundBuffer = [];
      this.clipboard = []; 

      //STATE
      this.state = {
        bpm: this.defaultBpm,
        bpms: this.defaultBpm / 60 / 1000,
        state: "stop",
        connect: true,
        dtu: false,
        realtimeRender: true,
        playbackNotes: false,
        timeSignature: [4,4]
      }

      this.tracks = this.initTracks();      

      //Init AudioContext
      this.audioCtx = this.initAudioContext();

      //REFS
      
      this.tracksContainerRef = React.createRef();
      this.timePointerRef = React.createRef();
      this.timeTextRef = React.createRef();      
      this.fileReaderRef = React.createRef();      
  }




  /*
  * LIFECYCLE
  */

  componentDidMount () {
    this.addEvents();
    this.tryDrawNotes();
    this.updateTimeControls();
    this.initSoundBuffer();
  }

  componentDidUpdate() {
    this.tryDrawNotes();
  }

  componentWillUnmount () {
    document.removeEventListener("keyup", this.handleKeyDown);
  }




  /*
  * INIT FUNCTIONS
  */

  initTracks() {
    const tracks = [...tracksData];
    //Init empty tracks
    tracks.forEach(track => {        
      for (let tIdx = 0; tIdx < this.tracksLengthInTakts; tIdx++) { 
        track.ts =   Date.now()+"_"+tIdx       
        track.takts[tIdx] = {
          ts: Date.now()+"_"+tIdx,
          notes: []
        }      
        for (let nIdx = 0; nIdx < this.notesInTakt; nIdx++) {
          track.takts[tIdx].notes[nIdx] = 0;           
        }
      }
    });
    return tracks;
  }

  initAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    return new AudioContext();
  }

  addEvents() {
    document.addEventListener("keyup", this.handleKeyDown);
    document.addEventListener('keydown', function (e) {
        if (e.keyCode === 32) {
            e.preventDefault();
        }
    }, false)
    this.tracksContainerRef.current.addEventListener('wheel', this.handleTracksWheel);
  }

  /*
  * SOUND BUFFER
  */

  initSoundBuffer() {
    this.tracks.forEach( (_track, trackIndex) => {
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
 



  /*
  * HANDLE KEYS
  */

  handleKeyDown= (e) => {
    e.preventDefault();
    switch (e.keyCode) {
      // Space
      case 32:
        if (this.state.state === "play") {
          this.pause();
        } else if ( (this.state.state === "stop" || this.state.state === "pause") && this.timelineNote < this.tracksLengthInNotes) {
          this.play();
        }
        break;
      // S
      case 83:
        //if (this.state.state === "play" || this.state.state === "pause") {
          this.stop();
        //} 
      break;
      default:
        break;
    }
    return false;
  }
  



  /*
  * HANDLE INPUT CHANGES
  */
  handleBpmInputChange = (event) => {
    let value = event.target.value;
    value = value === '' ? '1' : value;

    var regNumber = /^[0-9\b]+$/;
    if (regNumber.test(value)){
      let intValue = parseInt(value);
      intValue = intValue < 1 ?  1 : intValue;
      intValue = intValue > 300 ? 300 : intValue;

      this.setState({
        bpm: intValue,
        bpms: intValue / 60 / 1000,
      })  
    }  
  }

  handleBooleanInputChange = (event) => {
    // console.log(event.target.checked);
    let name = event.target.name;
    let value = event.target.checked;

    if (name === 'realtimeRender') {
        this.props.onChangeRealtimeRender && this.props.onChangeRealtimeRender(value);
    }

    this.setState({
      [name]: value,
    }) 
  }


  handleTimeSignatureChange = (event) => {
    let value = [parseInt(event.target.value.split("/")[0]), parseInt(event.target.value.split("/")[1])]
    this.setTimeSignature(value,  () => {
      this.forceUpdate();
    });    
  }

  updateTimeSignatureRelativeProperties = (newTimeSignature) => {
    this.updateNotesInTakt(newTimeSignature);
    this.updateTrackLength(newTimeSignature);
    this.updateNotesSacle(newTimeSignature);    

    console.log("TimeSignature:", newTimeSignature, "notesInTakt:", this.notesInTakt , 'tracksLengthInTakts:', this.tracksLengthInTakts, 'tracksLengthInNotes:', this.tracksLengthInNotes, );
  }


  updateNotesInTakt = (newTimeSignature) => {
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
    this.notesInTakt = up * notesInPart;
  }

  updateTrackLength = () => {
    this.tracksLengthInTakts = Math.ceil(this.tracksLengthInNotes / this.notesInTakt);
    this.tracksLengthInNotes = this.tracksLengthInTakts * this.notesInTakt;
  }

  updateNotesSacle = () =>{
    //Масштабируем размер нот так, чтобы помещались элементы управления такта
    let estimatedWidth = this.noteWidth * this.notesInTakt;
    if (estimatedWidth < this.minTaktControlWidth) {
      this.noteWidth = Math.ceil(this.minTaktControlWidth / this.notesInTakt)
    } else {
      this.noteWidth = this.defaultNotewWidth;
    }
  }


  setTimeSignature = (value, callback) => {    
    //ОБновляю связанные свойтсва (длина трека, ноты в такте и т.д.)
    this.updateTimeSignatureRelativeProperties(value);

    //Изменение структуры трека
    let tmpTracks = [...this.tracks];

    for (let i = 0; i < tmpTracks.length; i++) {
      let tmpTrack = {...tmpTracks[i]};

      //Поулчаю ноты в плоском виде, чтобы легче их распихать по новым тактам
      let plainNotes = [];      
      tmpTrack.takts.forEach(takt => {
        plainNotes = plainNotes.concat(takt.notes);
      });
      //console.log(plainNotes);

      //Заполняю новую структуру
      let noteCounter = 0;
      tmpTrack.takts = [];
      for (let tIdx = 0; tIdx < this.tracksLengthInTakts; tIdx++) { 
        tmpTrack.ts =   Date.now()+"_"+tIdx       
        tmpTrack.takts[tIdx] = {
          ts: Date.now()+"_"+tIdx,
          notes: []
        }      
        for (let nIdx = 0; nIdx < this.notesInTakt; nIdx++) {
          tmpTrack.takts[tIdx].notes[nIdx] = plainNotes[noteCounter] || 0;  
          noteCounter++;         
        }
      }

      tmpTracks[i] = tmpTrack;      
    }
    this.tracks = [...tmpTracks];
    //console.log("New track struckture", tmpTracks);
    
    //Обновление состояни для обновления UI
    this.setState({
      timeSignature: value,
    }, callback); 
  }

/*
* DRAW NOTES
*/

  tryDrawNotes(force) {
    if (!this.state.realtimeRender && !force) {
      return;
    }

    //console.log('tryDrawNotes', this.tracks);
    let maxTaktCount = 0;

    for (let tIdx = 0; tIdx < this.tracks.length; tIdx++) {
      const _track = this.tracks[tIdx];
      
      for (let taktIdx = 0; taktIdx < _track.takts.length; taktIdx++) {
        const _takt = _track.takts[taktIdx];
        let tmpMaxTaktCount = (taktIdx + 1); // make +1 to convert index to count
        maxTaktCount = (_takt.notes.lastIndexOf(1) >= 0 && tmpMaxTaktCount > maxTaktCount) ?  tmpMaxTaktCount : maxTaktCount; 
      }
    } 

    this.props.onRenderNotes && this.props.onRenderNotes(this.tracks, maxTaktCount, this.state.bpm, this.state.timeSignature, this.notesInTakt);
  }

  


/*
* TOOLBAR ACTIONS
*/
  save = () => {
    console.log("save");
    
    //TODO: improve data to save
    let saveData = {
      bpm: this.state.bpm,
      timeSignature: this.state.timeSignature,
      tracks: this.tracks,     
    }
    let content = JSON.stringify(saveData);
    let filename = "BeatNotation_"+Date.now()+".beno";
    const file = new Blob([content], {type: 'application/json'});

    const a = document.createElement('a');
    a.href= URL.createObjectURL(file);
    a.download = filename;
    a.click();
  
    URL.revokeObjectURL(a.href);
  }

  load = () => {
    console.log("load");
    this.fileReaderRef.current.selectFile();
  }

  handleFileLoaded = (content) => {
    console.log("loaded");
    //Load from files:
    //-volume
    //-notes
    //-trackLength

    var data = JSON.parse(content);
    var maxTaktCount = 0;

    for (let it = 0; it < this.tracks.length; it++) {
      const tmpTrack = {...this.tracks[it]};
      const loadedTrack = data.tracks[it];
      tmpTrack.volume = loadedTrack.volume;
      tmpTrack.takts = [...loadedTrack.takts];
      tmpTrack.ts = Date.now();
      this.tracks[it] = tmpTrack;
      maxTaktCount = tmpTrack.takts.length > maxTaktCount ? tmpTrack.takts.length : maxTaktCount;
    }

    //calc new notesInTakt
    this.updateNotesInTakt(data.timeSignature);

    //update tracks length
    this.tracksLengthInTakts = maxTaktCount;
    this.tracksLengthInNotes = this.tracksLengthInTakts * this.notesInTakt;
    this.timestamp = 0;

    //update note scale
    this.updateNotesSacle(data.timeSignature); 
    

    console.log("BPM:", data.bpm);
    console.log("TimeSignature:", data.timeSignature);
    console.log("tracksLengthInNotes:", this.tracksLengthInNotes);
    console.log("FileData:", data);

    this.setState({
      bpm: data.bpm,
      bpms: data.bpm / 60 / 1000,
      timeSignature: data.timeSignature
    }, () => {
      this.updateTimeControls()
    })
  }

  print = () => {
    console.log("print");
    this.tryDrawNotes(true);
    window.print();
  }

  play = () => {
    console.log("play");
    this.playPrevTs = Date.now();
    this.timerId = setInterval(this.step, this.stepDelay);

    this.setState({
      state: "play"
    })    
  }

  stop = () => {
    console.log("stop");

    clearInterval(this.timerId);

    this.timestamp = 0;
    this.updateTimeControls();

    this.setState({
      state: "stop"
    })
  }

  pause = () => {
    console.log("pause");

    clearInterval(this.timerId);

    this.setState({
      state: "pause"
    })
  }




/*
* PLAY CYCLE
*/
  step = () => {
    //this.timestamp = this.timestamp + this.stepDelay;
    this.timestamp = this.timestamp + (Date.now() - this.playPrevTs);
    this.playPrevTs = Date.now();
    this.playNotes();
    requestAnimationFrame(this.updateTimeControls.bind(this));

    //Pause then end
    if(this.timelineNote > this.tracksLengthInNotes)
    {
      this.pause();   
    }
  }

  playNotes = () => {    
    let noteIndex = Math.trunc(this.timelineNote);
   
    if (noteIndex === this.prevNoteIndex)
      return;
      
    let taktIndex = Math.trunc(this.timelineTakt)
    let noteIndexInTakt = noteIndex % this.notesInTakt;

    if (taktIndex + 1> this.tracksLengthInTakts) {
      return;
    }

    //console.log('playNotes', taktIndex,noteIndexInTakt);

    //console.log(noteIndex);
    for (let trackIndex = 0; trackIndex < this.tracks.length; trackIndex++) {
      const track = this.tracks[trackIndex];
      const takt = track.takts[taktIndex];
      if (takt.notes[noteIndexInTakt] > 0) {
        this.playTrackSound(trackIndex);
      }
    }    

    this.prevNoteIndex = noteIndex;
  }

  playTrackSound(trackIndex) {
    //set gain
    this.soundBuffer[trackIndex].gainNode.gain.value = this.tracks[trackIndex].volume; 
    // play sound
    let source = this.audioCtx.createBufferSource();
    source.buffer = this.soundBuffer[trackIndex].audioBuffer;
    source.connect(this.soundBuffer[trackIndex].gainNode);
    source.start();
  } 

  updateTimeControls() {
    if (this.state.dtu)
      return;

    this.timeTextRef.current.innerText = "Time: " + this.getFormattedTime;
    this.timePointerRef.current.style.left = this.timePointerXPos + "px";
  }




  /*
  * WORKSPACE EVENTS
  */
  handleNoteClick = (trackIndex, taktIndex, noteIndex, level) => {
    //console.log('handleNoteClick', trackIndex, taktIndex, noteIndex)

    let track = this.tracks[trackIndex];
    let takt = track.takts[taktIndex];
    takt.notes[noteIndex] = level;
    //track.ts = Date.now();

    // Проигрываю выбранную ноту
    if (level > 0 && this.state.playbackNotes) {
      this.playTrackSound(trackIndex);
    }

    // Рисую ноты
    this.tryDrawNotes();
    //this.forceUpdate();
  }

  handleTrackVolumeChange = (trackIndex, value) => {
    console.log("handleTrackVolumeChange", trackIndex, value);
    let track = this.tracks[trackIndex];
    track.volume = value;
    track.ts = Date.now();
    this.forceUpdate();
  }

  handleTimelineClick = (e) => {    
    e.preventDefault();
    //Получаю координату клика внутри временной шкалы
    let parentContainer = e.currentTarget.parentNode;
    let targetX = e.pageX - e.currentTarget.offsetLeft + parentContainer.scrollLeft;

    // Вычисляю положение относительно нот
    let notePosition = targetX / this.noteWidth;
    let newTimestamp = Math.trunc(notePosition / this.state.bpms / this.notesInPartCount);
    
    // Обновляю время
    this.timestamp = newTimestamp;
    this.updateTimeControls();
    this.forceUpdate();
  }

  handleAddTakt = (e) => {
    console.log('Add takt');
    this.tracksLengthInTakts = this.tracksLengthInTakts + 1;
    this.tracksLengthInNotes = this.tracksLengthInTakts * this.notesInTakt; 

    this.tracks.forEach(track => {
        track.takts = [
          ...track.takts,
          {
            notes: [...Array(this.notesInTakt)].map(el => {return 0}),
            ts: Date.now() + "_" +(this.tracksLengthInTakts-1)
          }          
      ];  
    });
    console.log(this.tracks)

    //Прокрутка
    //Получаю координату клика внутри временной шкалы
    let parentContainer = e.currentTarget.parentNode || e.target.parentNode;

    // Обновляю приложение
    this.forceUpdate(() => {      
      if (!!parentContainer) {
        parentContainer.scrollLeft=parentContainer.scrollLeft+this.noteWidth*this.notesInTakt;
      }
    });    
  }

  handleTracksWheel = (e) => {
    e.preventDefault();
    this.tracksContainerRef.current.scrollLeft += e.deltaY;;
  }

  /*
  TAKT ACTIONs
  */
  handleDeleteClick = (taktIndex) => {
    console.log('Delete', taktIndex);

    this.tracksLengthInTakts = this.tracksLengthInTakts - 1;
    this.tracksLengthInNotes = this.tracksLengthInTakts * this.notesInTakt;
    this.tracks.forEach(track => { 
      track.ts = Date.now();
      var tmpArr = [...track.takts];
      tmpArr.splice(taktIndex, 1)
      track.takts = [...tmpArr]
    });

    this.forceUpdate();
  }

  handleClearClick = (taktIndex) => {
    console.log('Clear', taktIndex);

    this.tracks.forEach( (track, trackIndex) => { 
      track.ts = Date.now();
      track.takts[taktIndex] = {};
      track.takts[taktIndex].ts = Date.now()+"_"+taktIndex;
      track.takts[taktIndex].notes = [];
      for (let i = 0; i < this.notesInTakt; i++) {  
        track.takts[taktIndex].notes[i] = 0;  
      }      
    });

    this.forceUpdate();
  }

  handleCopyClick = (taktIndex) => {
    console.log('Copy', taktIndex);

    this.clipboard = [];

    this.tracks.forEach( (track, trackIndex) => { 
      this.clipboard[trackIndex] = [...track.takts[taktIndex].notes];
    });

    console.log('Buffer', this.clipboard);
  }

  handlePasteClick = (taktIndex) => {
    console.log('Paste', taktIndex, this.clipboard);

    if (this.clipboard.length === 0) {
      console.log('Empty buffer');
      return;
    }

    this.tracks.forEach( (track, trackIndex) => { 
      track.ts = Date.now();
      track.takts[taktIndex] = {};
      track.takts[taktIndex].notes = [];
      //Oops. Из буфера читаем только ноты для нашего размера такта, лишнее не берём
      for (let i = 0; i < this.notesInTakt; i++) {  
        track.takts[taktIndex].notes[i] = this.clipboard[trackIndex][i] || 0;  
      } 
      track.takts[taktIndex].ts = Date.now()+"_"+taktIndex;
    });
    
    console.log(this.tracks );
    this.forceUpdate();
  }




  /*
  * GETTERS
  */
  get timePointerXPos() {
    return this.timelineNote * this.noteWidth - this.timePointerWidth/2 + 2 + this.trackControlWidth;
  }

  get timePointerHeight() {
    return this.tracks.length * this.noteHeight + this.timePointerWidth;
  }

  get timelineNote() {
    return this.timestamp * this.state.bpms * this.notesInPartCount;
  }

  get timelineTakt() {
    return this.timelineNote / this.notesInTakt;
  }

  get getFormattedTime() {
    let ms = this.timestamp % 1000;
    let sec = Math.trunc(this.timestamp / 1000) % 60;
    let min = Math.trunc(this.timestamp / 1000 / 60)
    return (min+'').padStart(2,"0") + ":" +(sec+'').padStart(2,"0") + "." + (ms+'').padStart(3,"0")
  }

  get timeSignatureString() {
    return this.state.timeSignature[0]+"/"+this.state.timeSignature[1];
  }


  render () {
    console.log('Render Editor');

    return <div className="Editor">
      <div className="app-toolbar no-print">
        <button className="app-toolbar__button" onClick={this.play} disabled={this.state.state === "play" || this.timelineNote >= this.tracksLengthInNotes}>Play</button>
        <button className="app-toolbar__button" onClick={this.stop} disabled={this.state.state === "stop"}>Stop</button>
        <button className="app-toolbar__button" onClick={this.pause} disabled={this.state.state === "pause" || this.state.state === "stop"}>Pause</button>
        <button className="app-toolbar__button" onClick={this.print} disabled={this.state.state === "play"}>Print notation</button>
        <button className="app-toolbar__button" onClick={this.save} disabled={this.state.state === "play"}>Save project</button>
        <button className="app-toolbar__button" onClick={this.load} disabled={this.state.state === "play"}>Load project</button>

        {/* <div className="app-toolbar__part" >
          Part: {Math.trunc(this.timelineNote) + 1 }
        </div> */}
        <div className="app-toolbar__bpm" >
          Time signature: 
          <select name='timeSignature' value={this.timeSignatureString} onChange={this.handleTimeSignatureChange}>
            {this.timeSignatures.map(ts => {
              return <option key={ts} value={ts}>{ts}</option>
            })}
          </select>
        </div>

        <div className="app-toolbar__bpm" >
          BPM: 
          <input name="bpm" value={this.state.bpm} onChange={this.handleBpmInputChange} type="number"></input>
        </div>

        <div className="app-toolbar__time" ref={this.timeTextRef}>
          {/* Time: {this.getFormattedTime} */}
        </div>

        {/* <div>
          Connect notes: 
          <input name="connect" value={this.state.connect} onChange={this.handleBooleanInputChange} checked={this.state.connect} type="checkbox"></input>
        </div> */}
        {/* <div>
          Disable time update: 
          <input name="dtu" value={this.state.dtu} onChange={this.handleBooleanInputChange} checked={this.state.dtu} type="checkbox"></input>
        </div> */}
        <div>
          Show notation: 
          <input name="realtimeRender" value={this.state.realtimeRender} onChange={this.handleBooleanInputChange} checked={this.state.realtimeRender} type="checkbox"></input>
        </div>
        <div>
          Playback notes: 
          <input name="playbackNotes" value={this.state.playbackNotes} onChange={this.handleBooleanInputChange} checked={this.state.playbackNotes} type="checkbox"></input>
        </div>
      </div>

      <div className="workspace no-print"> 
        
        <div className="track-container" ref={this.tracksContainerRef}>
          {/* TIMELINE */}
          <div className="timeline" style={{width:this.noteWidth * this.tracksLengthInNotes + "px", marginLeft: this.trackControlWidth+"px"}} onClick={this.handleTimelineClick}>
            {
               [...Array(Math.ceil(this.tracksLengthInNotes / this.notesInTakt))].map((i,k) => {
                return <div key={k} className="timeline__takt" style={{width: this.notesInTakt * this.noteWidth}}>
                    <div className="takt__number">{k+1}</div>
                  </div>
              })
            }
          </div>
          {/* TIME POINTER */}
          <div className="time-pointer" ref={this.timePointerRef}> 
            <div className="time-pointer__stick" style={{height: this.timePointerHeight+"px"}}>
            </div>
          </div>

          {/* TRACKS */}
          {
            this.tracks.map((_track,i) => {
              return <Track key={"track_"+i} index={i} noteWidth={this.noteWidth} noteHeight={this.noteHeight} noteClick={this.handleNoteClick} 
                              tracksLengthInNotes={this.tracksLengthInNotes} tracksLengthInTakts={this.tracksLengthInTakts} 
                              timeSignature={this.state.timeSignature}
                              track={_track} ts={_track.ts} 
                              trackControlWidth={this.trackControlWidth} addTaktButtonWidth={this.addTaktButtonWidth}
                              onVolumeChange={this.handleTrackVolumeChange}
                              />
            })
          }

          {/* TAKT CONTROLS */}
          <div className="takt-controls" style={{width:this.noteWidth * this.tracksLengthInNotes + "px", marginLeft: this.trackControlWidth+"px"}}>
            {
               [...Array(Math.ceil(this.tracksLengthInTakts))].map((i,k) => {
                return <div key={k} className="takt-control" style={{width: this.notesInTakt * this.noteWidth}}>
                    <button className="takt-control__button button" onClick={this.handlePasteClick.bind(this, k)}>Paste</button>
                    <button className="takt-control__button button" onClick={this.handleCopyClick.bind(this, k)}>Copy</button>
                    <button className="takt-control__button button" onClick={this.handleClearClick.bind(this, k)}>Clear</button>
                    <button className="takt-control__button button" onClick={this.handleDeleteClick.bind(this, k)}>Delete</button>
                    <div style={{clear: "both"}}></div>
                  </div>
              })
            }
          </div>

          {/* BUTTON ADD TAKT */}
          <div className="takt-add" style={{width:this.addTaktButtonWidth, height: this.tracks.length * this.noteHeight + this.taktControlHeight + "px", marginTop: -this.tracks.length * this.noteHeight - this.taktControlHeight + "px"}}
                onClick={this.handleAddTakt}> 
                <div className="takt-add__content">+</div>           
          </div>

        </div>
        
       
      </div>

      <UserFileReader  ref={this.fileReaderRef} onFileLoaded={this.handleFileLoaded} accept=".beno"/>
    </div>
  }
}