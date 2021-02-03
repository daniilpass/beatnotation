import React from "react";
import axios from 'axios';

import CanvasNotes from "../noteList/noteList";
import Track from "../track/track";
import {tracksData} from "./TracksData";

import './reset.css';
import './App.css';

class App extends React.Component {
  constructor(props){
      super(props);
      
      //VARS
      this.defaultBpm = 120;
      this.notesInPartCount = 4;

      this.notesInTakt = 16;
      this.tracksLengthInTakts = 48;
      this.tracksLengthInNotes = this.tracksLengthInTakts * this.notesInTakt;

      this.noteWidth = 20;
      this.noteHeight = 31;
      this.taktControlHeight = 31;
      this.trackControlWidth = 200;
      this.addTaktButtonWidth = 100;
      this.timePointerWidth = 10;

      this.timerId = 0;
      this.stepDelay = 10;
      this.prevNoteIndex = -1;
      this.prevTaktIndex = -1;
      this.timestamp = 0;
      this.playPrevTs = 0;

      this.soundBuffer = [];
      this.clipboard = []; 

      this.tracks = this.initTracks();      

      //Init AudioContext
      this.audioCtx = this.initAudioContext();

      //STATE
      this.state = {
        bpm: this.defaultBpm,
        bpms: this.defaultBpm / 60 / 1000,
        state: "stop",
        connect: true,
        dtu: false,
        realtimeRender: true
      }

      //REFS
      this.canvasRef = React.createRef();
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
            this.soundBuffer[trackIndex].audioBuffer = audioBuffer;
            console.log("Sample loaded", _track.audioUrl);
          })      
    });
  }

  loadAudioSample = (url, callback) => {
    console.log("Loading sample", url);
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
    this.setState({
      [event.target.name]: event.target.checked,
    }) 
  }




/*
* DRAW NOTES
*/

  tryDrawNotes(force) {
    if (!this.state.realtimeRender && !force) {
      return;
    }
    
    let maxTaktCount = 0;

    for (let tIdx = 0; tIdx < this.tracks.length; tIdx++) {
      const _track = this.tracks[tIdx];
      for (let taktIdx = 0; taktIdx < _track.takts.length; taktIdx++) {
        const _takt = _track.takts[taktIdx];
        maxTaktCount = (_takt.notes.lastIndexOf(1) >= 0 && taktIdx > maxTaktCount) ?  taktIdx : maxTaktCount;
      }
    }
    maxTaktCount = maxTaktCount + 1; //INdex to count

    this.canvasRef && this.canvasRef.current && this.canvasRef.current.draw(this.tracks, maxTaktCount, this.state.bpm);
  }

  


/*
* TOOLBAR ACTIONS
*/
  save = () => {
    console.log("save");
    
    //TODO: improve data to save
    let saveData = {
      tracks: this.tracks,
      bpm: this.state.bpm
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

    this.tracksLengthInTakts = maxTaktCount;
    this.tracksLengthInNotes = this.tracksLengthInTakts * this.notesInTakt;
    this.timestamp = 0;

    console.log("BPM:", data.bpm);
    console.log("tracksLengthInNotes:", this.tracksLengthInNotes);
    console.log("FileData:", data);

    this.setState({
      bpm: data.bpm,
      bpms: data.bpm / 60 / 1000
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
    window.requestAnimationFrame(this.updateTimeControls.bind(this));

    //Pause then end
    if(this.timelineNote > this.tracksLengthInNotes)
      this.pause();  
  }

  playNotes = () => {    
    let noteIndex = Math.trunc(this.timelineNote);
   
    if (noteIndex === this.prevNoteIndex)
      return;

    let taktIndex = Math.trunc(this.timelineTakt)
    let noteIndexInTakt = noteIndex % this.notesInTakt;

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
    let source = this.audioCtx.createBufferSource();
    source.buffer = this.soundBuffer[trackIndex].audioBuffer;
    source.connect(this.audioCtx.destination);
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
    if (level > 0) {
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
    // console.log(...this.tracks)
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
        parentContainer.scrollLeft=Number.MAX_SAFE_INTEGER;
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
      track.takts[taktIndex].notes = [...this.clipboard[trackIndex]];
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




  render () {
    console.log('Render App');

    return <div className="App">
      <header className="App-header no-print">
        Beat Notation
      </header>

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

      <UserFileReader ref={this.fileReaderRef} onFileLoaded={this.handleFileLoaded} accept=".beno"/>

      <CanvasNotes ref={this.canvasRef} style={{display: this.state.realtimeRender ? 'block' : 'none'}}/>
    </div>
  }
}

export default App;

class UserFileReader extends React.PureComponent {

  constructor(props){
    super(props);

    this.input = React.createRef();
  }

  selectFile = () => {
    this.input.current.click();
  }

  fileInputChange = (e) => {
    this.loadFile();
  }

  loadFile = () => {
    if (this.input.current.files.length === 0) {
      return;
    } 

    let file = this.input.current.files[0];
    var reader = new FileReader();
    reader.onload = (re) => {
      var fileContent = re.target.result;
      this.props.onFileLoaded && this.props.onFileLoaded(fileContent);
    }
    reader.onerror = () => {
      alert("Can't load file");
    }
    reader.readAsText(file);    
  }
  
  

  render() {
    return <div className="file-reader" style={{display:"none"}}> 
            <input type="file" ref={this.input} onChange={this.fileInputChange} accept={this.props.accept}></input>
          </div>
  }
}