import React from "react";
import './reset.css';
import './App.css';



import CanvasNotes from "../noteList/noteList";
import Track from "../track/track";

import SoundCrash from '../../assets/sounds/crash.mp3';
import SoundRide from '../../assets/sounds/ride.mp3';
import SoundHiHatClosed from '../../assets/sounds/hh_closed.mp3';
import SoundHiHatOpened from '../../assets/sounds/hh_open.mp3';
import SoundSnare from '../../assets/sounds/snare.mp3';
import SoundBass from '../../assets/sounds/kick.mp3';
import SoundTomHi from '../../assets/sounds/tom_hi.mp3';
import SoundTomMid from '../../assets/sounds/tom_mid.mp3';
import SoundTomLow from '../../assets/sounds/tom_low.mp3';

import axios from 'axios';

class App extends React.Component {
  constructor(props){
      super(props);

      
      this.timerId = 0;
      this.stepDelay = 10;
      this.noteWidth = 20;
      this.defaultBpm = 120;
      this.notesInPartCount = 4;
      this.tracksLength = 7200;//256;
      this.prevNoteIndex = -1;
      this.timePointerWidth = 10;
      this.noteHeight = 31;
      this.taktControlHeight = 31;
      this.trackControlWidth = 200;
      this.addTaktButtonWidth = 100;
      this.notesInTakt = 16;
      this.buffer = [];
      // types
      // 1 - cricle
      // 2 - cross
      // 3 - cross with o
      this.tracks = [
        {
          audioUrl: SoundCrash,
          // audio: new Audio(SoundCrash),
          volume: 0.5,
          notes: [],
          line: 0.5,
          type: 2,
          title: "Crash"
        },
        {
          audioUrl: SoundRide,
          // audio: new Audio(SoundRide),
          volume: 1,
          notes: [],
          line: 1.5,
          type: 2,
          title: "Ride"
        },
        {
          audioUrl: SoundHiHatClosed, 
          // audio: new Audio(SoundHiHatClosed),
          volume: 1,
          notes: [],
          line: 1,
          type: 2,
          title: "Hi-Hat Closed"
        },
        {
          audioUrl: SoundHiHatOpened,
          // audio: new Audio(SoundHiHatOpened),
          volume: 1,
          notes: [],
          line: 1,
          type: 3,
          title: "Hi-Hat Open"
        },
        {
          audioUrl: SoundSnare,
          // audio: new Audio(SoundSnare),
          volume: 1,
          notes: [],
          line: 3,
          type: 1,
          title: "Snare"
        },
        {
          audioUrl: SoundTomHi,
          // audio: new Audio(SoundTomHi), // tom 2
          volume: 1,
          notes: []  ,
          line: 2,
          type: 1,
          title: "Tom Hi"
        },
        {
          audioUrl: SoundTomMid,
          // audio: new Audio(SoundTomMid), // tom 2
          volume: 1,
          notes: []  ,
          line: 2.5,
          type: 1,
          title: "Tom Mid"  
        },
        {
          audioUrl: SoundTomLow,
          // audio: new Audio(SoundTomLow), //floor tom
          volume: 1,
          notes: []  ,
          line: 4,
          type: 1,
          title: "Tom Low"  
        },
        {
          audioUrl: SoundBass,
          // audio: new Audio(SoundBass),
          volume: 1,
          notes: []  ,
          line: 5,
          type: 1,
          title: "Kick"  
        },
      ]

      //console.log(this.tracks, SoundSnare);

      this.tracks.forEach(track => {
        for (let i = 0; i < this.tracksLength; i++) {
          track.notes[i] = 0;       
        }
      });

      // for test
      //console.log(this.tracks[0]);
      // this.tracks[3].notes[0] = 1; this.tracks[3].notes[4] = 1; this.tracks[3].notes[8] = 1; this.tracks[3].notes[12] = 1; 
      // this.tracks[3].notes[16] = 1; this.tracks[3].notes[20] = 1; this.tracks[3].notes[24] = 1; this.tracks[3].notes[28] = 1; 
      // this.tracks[3].notes[32] = 1; this.tracks[3].notes[36] = 1; this.tracks[3].notes[40] = 1; this.tracks[3].notes[44] = 1; 
      // this.tracks[3].notes[48] = 1; this.tracks[3].notes[52] = 1; this.tracks[3].notes[56] = 1; this.tracks[3].notes[60] = 1;
      // this.tracks[3].notes[64] = 1; this.tracks[3].notes[68] = 1; this.tracks[3].notes[72] = 1; this.tracks[3].notes[76] = 1;
      // this.tracks[4].notes[4] = 1; this.tracks[4].notes[12] = 1; this.tracks[4].notes[20] = 1;  this.tracks[4].notes[28] = 1;
      // this.tracks[8].notes[0] = 1; this.tracks[8].notes[6] = 1; this.tracks[8].notes[10] = 1;
      // this.tracks[8].notes[16] = 1; this.tracks[8].notes[22] = 1; 

      this.state = {
        bpm: this.defaultBpm,
        bpms: this.defaultBpm / 60 / 1000,
        state: "stop",
        connect: true,
        dtu: false,
        useAudioContext: true,
        realtimeRender: false
      }

      this.canvasRef = React.createRef();
      this.tracksContainerRef = React.createRef();
      this.timePointerRef = React.createRef();
      this.timeTextRef = React.createRef();
      this.timestamp = 0;
      this.playPrevTs = 0;
      this.fileReaderRef = React.createRef();


      this.soundBuffer = [];
      // this.bufferSize = 1;

      //try fix delay
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
  }

  componentDidMount () {
    document.addEventListener("keyup", this.handleKeyDown);
    document.addEventListener('keydown', function (e) {
        if (e.keyCode === 32) {
            e.preventDefault();
        }
    }, false)
    this.tracksContainerRef.current.addEventListener('wheel', this.handleTracksWheel);
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

  // shouldComponentUpdate() {
  //   console.log('shouldComponentUpdate', 'App');
  //   return true;
  // }


  /*
  AUDIO CONTEXT
  */

  loadAudioSample = (url, callback) => {
    console.log("Loading sample", url);
    axios.get(url, {responseType: 'arraybuffer'})
          .then(response => {
            this.audioCtx.decodeAudioData(response.data, callback, (e) => { console.log("decodeAudioData failed", e); });
          })   
  }  

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

 

  tryDrawNotes(force) {
    if (!this.state.realtimeRender && !force) {
      return;
    }
    
    // get max right note index
    let notesCount = 0;
    this.tracks.forEach(t => {
      let nc = t.notes.lastIndexOf(1);  
      notesCount = nc > notesCount ? nc : notesCount;
    });
    notesCount++; // Перевожу индекс в число нот
    notesCount = notesCount + (16 - notesCount % 16) ; //Добиваю число нот до конца такта
    //console.log('====> tryDrawNotes', notesCount);
    this.canvasRef && this.canvasRef.current && this.canvasRef.current.draw(this.tracks, notesCount, this.state.bpm);
  }

  handleKeyDown= (e) => {
    e.preventDefault();
    switch (e.keyCode) {
      // Space
      case 32:
        if (this.state.state === "play") {
          this.pause();
        } else if ( (this.state.state === "stop" || this.state.state === "pause") && this.part < this.tracksLength) {
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
    var maxTrackLength = 0;

    for (let it = 0; it < this.tracks.length; it++) {
      const tmpTrack = {...this.tracks[it]};
      const loadedTrack = data.tracks[it];
      tmpTrack.volume = loadedTrack.volume;
      tmpTrack.notes = [...loadedTrack.notes];
      tmpTrack.ts = Date.now();
      this.tracks[it] = tmpTrack;
      maxTrackLength = tmpTrack.notes.length > maxTrackLength ? tmpTrack.notes.length : maxTrackLength;
    }
    this.tracksLength = maxTrackLength;
    this.timestamp = 0;

    console.log("BPM:", data.bpm);
    console.log("TracksLength:", this.tracksLength);
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

  step = () => {
    //this.timestamp = this.timestamp + this.stepDelay;
    this.timestamp = this.timestamp + (Date.now() - this.playPrevTs);
    this.playPrevTs = Date.now();
    this.playNotes();
    window.requestAnimationFrame(this.updateTimeControls.bind(this));

    //Pause then end
    if(this.part > this.tracksLength)
      this.pause();  
  }

  playNotes = () => {
    let noteIndex = Math.trunc(this.part);

    if (noteIndex === this.prevNoteIndex)
      return;

    //console.log(noteIndex);
    for (let trackIndex = 0; trackIndex < this.tracks.length; trackIndex++) {
      const track = this.tracks[trackIndex];
      if (track.notes[noteIndex] > 0) {
        this.playTrackSound(trackIndex);
      }
    }    

    this.prevNoteIndex = noteIndex;
  }

  playTrackSound(trackIndex) {
    if (this.state.useAudioContext) {
      this.playTrackSoundUsingBuffer(trackIndex);
      return;
    }
    const track = this.tracks[trackIndex];
    let audio = new Audio(track.audioUrl);
    audio.volume = track.volume;    
    audio.play();
  }

  playTrackSoundUsingBuffer(trackIndex){    
    let source = this.audioCtx.createBufferSource();
    source.buffer = this.soundBuffer[trackIndex].audioBuffer;
    source.connect(this.audioCtx.destination);
    source.start();
  }  

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

  handleNoteClick = (trackIndex, noteIndex, level) => {
    //let track = {...this.tracks[trackIndex]};
    let track = this.tracks[trackIndex];
    track.notes[noteIndex] = track.notes[noteIndex] === 1 ? 0 : 1 ; //level;
    track.ts = Date.now();

    // Проигрываю выбранную ноту
    if (level > 0) {
      this.playTrackSound(trackIndex);
    }


    // Рисую ноты
    this.tryDrawNotes();

    this.forceUpdate();
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
    this.tracksLength = this.tracksLength + this.notesInTakt; //Добавлю ноты
    // console.log(...this.tracks)
    this.tracks.forEach(track => {
        track.notes = [...track.notes, ...[...Array(this.notesInTakt)].map(el => {return 0})];   
    });
    // console.log(...this.tracks)

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

    let noteStart = taktIndex * this.notesInTakt;
    this.tracksLength = this.tracksLength - this.notesInTakt;
    this.tracks.forEach(track => { 
      track.ts = Date.now();
      track.notes.splice(noteStart, this.notesInTakt) 
    });

    this.forceUpdate();
  }

  handleClearClick = (taktIndex) => {
    console.log('Clear', taktIndex);
    let noteStart = taktIndex * this.notesInTakt;
    let noteEnd = noteStart + this.notesInTakt;

    this.tracks.forEach(track => { 
      track.ts = Date.now();
      for (let index = noteStart; index < noteEnd; index++) {  
        track.notes[index] = 0;  
      }
    });

    this.forceUpdate();
  }

  handleCopyClick = (taktIndex) => {
    console.log('Copy', taktIndex);

    let noteStart = taktIndex * this.notesInTakt;
    let noteEnd = noteStart + this.notesInTakt;

    this.buffer = [];
    let counter = 0;

    this.tracks.forEach( (track, trackIndex) => { 
      this.buffer[trackIndex] = [];
      counter = 0;
      track.ts = Date.now();
      for (let noteIndex = noteStart; noteIndex < noteEnd; noteIndex++) {  
        this.buffer[trackIndex][counter] = track.notes[noteIndex];  
        counter++;
      }
    });

    console.log('Buffer', this.buffer);
  }

  handlePasteClick = (taktIndex) => {
    console.log('Paste', taktIndex, !this.buffer, this.buffer);

    if (this.buffer.length === 0) {
      console.log('Empty buffer');
      return;
    }

    let noteStart = taktIndex * this.notesInTakt;
    let noteEnd = noteStart + this.notesInTakt;
    let counter = 0;

    this.tracks.forEach( (track, trackIndex) => {  
      counter = 0;     
      track.ts = Date.now();
      for (let noteIndex = noteStart; noteIndex < noteEnd; noteIndex++) {  
        track.notes[noteIndex] = this.buffer[trackIndex][counter];  
        counter++;
      }
    });

    this.forceUpdate();
  }

  updateTimeControls() {
    if (this.state.dtu)
      return;

    this.timeTextRef.current.innerText = "Time: " + this.getFormattedTime;
    this.timePointerRef.current.style.left = this.timePointerXPos + "px";
  }

  get timePointerXPos() {
    return this.part * this.noteWidth - this.timePointerWidth/2 + 2 + this.trackControlWidth;
  }

  get timePointerHeight() {
    return this.tracks.length * this.noteHeight + this.timePointerWidth;
  }

  get part() {
    return this.timestamp * this.state.bpms * this.notesInPartCount;
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
        <button className="app-toolbar__button" onClick={this.play} disabled={this.state.state === "play" || this.part >= this.tracksLength}>Play</button>
        <button className="app-toolbar__button" onClick={this.stop} disabled={this.state.state === "stop"}>Stop</button>
        <button className="app-toolbar__button" onClick={this.pause} disabled={this.state.state === "pause" || this.state.state === "stop"}>Pause</button>
        <button className="app-toolbar__button" onClick={this.print} disabled={this.state.state === "play"}>Print notation</button>
        <button className="app-toolbar__button" onClick={this.save} disabled={this.state.state === "play"}>Save project</button>
        <button className="app-toolbar__button" onClick={this.load} disabled={this.state.state === "play"}>Load project</button>

        {/* <div className="app-toolbar__part" >
          Part: {Math.trunc(this.part) + 1 }
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
        <div>
          Disable time update: 
          <input name="dtu" value={this.state.dtu} onChange={this.handleBooleanInputChange} checked={this.state.dtu} type="checkbox"></input>
        </div>
        <div>
          Use AudioContext: 
          <input name="useAudioContext" value={this.state.useAudioContext} onChange={this.handleBooleanInputChange} checked={this.state.useAudioContext} type="checkbox"></input>
        </div>
        <div>
          Realtime render: 
          <input name="realtimeRender" value={this.state.realtimeRender} onChange={this.handleBooleanInputChange} checked={this.state.realtimeRender} type="checkbox"></input>
        </div>
      </div>

      <div className="workspace no-print"> 
        
        <div className="track-container" ref={this.tracksContainerRef}>
          {/* TIMELINE */}
          <div className="timeline" style={{width:this.noteWidth * this.tracksLength + "px", marginLeft: this.trackControlWidth+"px"}} onClick={this.handleTimelineClick}>
            {
               [...Array(Math.ceil(this.tracksLength / this.notesInTakt))].map((i,k) => {
                return <div key={k} className="timeline__takt" style={{width: this.notesInTakt * this.noteWidth}}>
                    <div className="takt__number">{k+1}</div>
                  </div>
              })
            }
          </div>
          {/* TIME POINTER */}
          {/* <TimePointer timePointerXPos={this.timePointerXPos} timePointerHeight={this.timePointerHeight}/> */}
          <div className="time-pointer" ref={this.timePointerRef}> 
            <div className="time-pointer__stick" style={{height: this.timePointerHeight+"px"}}>
            </div>
          </div>

          {/* TRACKS */}
          {
            this.tracks.map((_track,i) => {
              return <Track key={"track_"+i} index={i} noteWidth={this.noteWidth} noteHeight={this.noteHeight} noteClick={this.handleNoteClick} 
                              tracksLength={this.tracksLength} track={_track} ts={_track.ts} trackControlWidth={this.trackControlWidth} addTaktButtonWidth={this.addTaktButtonWidth}
                              onVolumeChange={this.handleTrackVolumeChange}
                              />
            })
          }

          {/* TAKT CONTROLS */}
          <div className="takt-controls" style={{width:this.noteWidth * this.tracksLength + "px", marginLeft: this.trackControlWidth+"px"}}>
            {
               [...Array(Math.ceil(this.tracksLength / this.notesInTakt))].map((i,k) => {
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

      <CanvasNotes ref={this.canvasRef} />
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