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
          audio: new Audio(SoundCrash),
          volume: 0.5,
          notes: [],
          line: 0.5,
          type: 2,
          title: "Crash"
        },
        {
          audioUrl: SoundRide,
          audio: new Audio(SoundRide),
          volume: 1,
          notes: [],
          line: 1.5,
          type: 2,
          title: "Ride"
        },
        {
          audioUrl: SoundHiHatClosed, 
          audio: new Audio(SoundHiHatClosed),
          volume: 1,
          notes: [],
          line: 1,
          type: 2,
          title: "Hi-Hat Closed"
        },
        {
          audioUrl: SoundHiHatOpened,
          audio: new Audio(SoundHiHatOpened),
          volume: 1,
          notes: [],
          line: 1,
          type: 3,
          title: "Hi-Hat Open"
        },
        {
          audioUrl: SoundSnare,
          audio: new Audio(SoundSnare),
          volume: 1,
          notes: [],
          line: 3,
          type: 1,
          title: "Snare"
        },
        {
          audioUrl: SoundTomHi,
          audio: new Audio(SoundTomHi), // tom 2
          volume: 1,
          notes: []  ,
          line: 2,
          type: 1,
          title: "Tom Hi"
        },
        {
          audioUrl: SoundTomMid,
          audio: new Audio(SoundTomMid), // tom 2
          volume: 1,
          notes: []  ,
          line: 2.5,
          type: 1,
          title: "Tom Mid"  
        },
        {
          audioUrl: SoundTomLow,
          audio: new Audio(SoundTomLow), //floor tom
          volume: 1,
          notes: []  ,
          line: 4,
          type: 1,
          title: "Tom Low"  
        },
        {
          audioUrl: SoundBass,
          audio: new Audio(SoundBass),
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
        connect: true
      }

      this.canvasRef = React.createRef();
      this.tracksContainerRef = React.createRef();
      this.timePointerRef = React.createRef();
      this.timeTextRef = React.createRef();
      this.timestamp = 0;
      this.playPrevTs = 0;
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
  }

  componentDidUpdate() {
    this.tryDrawNotes();
  }

  componentWillUnmount () {
    document.removeEventListener("keyup", this.handleKeyDown);
  }

  tryDrawNotes() {
    //return;
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
        } else if (this.state.state === "stop" || this.state.state === "pause") {
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

  print = () => {
    console.log("print");
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
    const track = this.tracks[trackIndex];
    let audio = new Audio(track.audioUrl);
    audio.volume = track.volume;
    audio.play();
  }

  handleBpmInputChange = (event) => {
    // let name = event.target.name;
    let value = event.target.value;

    this.setState({
      bpm: value,
      bpms: value / 60 / 1000,
    })    
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
    //console.log('Render App');

    return <div className="App">
      <header className="App-header no-print">
        Beat Notation
      </header>

      <div className="app-toolbar no-print">
        <button className="app-toolbar__button" onClick={this.play} disabled={this.state.state === "play"}>Play</button>
        <button className="app-toolbar__button" onClick={this.stop} disabled={this.state.state === "stop"}>Stop</button>
        <button className="app-toolbar__button" onClick={this.pause} disabled={this.state.state === "pause" || this.state.state === "stop"}>Pause</button>
        <button className="app-toolbar__button" onClick={this.print}>Print notation</button>
        
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

       <CanvasNotes ref={this.canvasRef} />
    </div>
  }
}

export default App;

class TimePointer extends React.Component {

  // constructor(props){
  //   super(props);

  //   this.posx = this.props.timePointerXPos;
  // }

  // shouldComponentUpdate(nextProps){
  //   console.log(Math.abs(this.posx  - nextProps.timePointerXPos), Math.abs(this.posx  - nextProps.timePointerXPos) > 50 );
  //   if (Math.abs(this.posx  - nextProps.timePointerXPos) > 50)
  //   {
  //     this.posx = this.props.timePointerXPos;
  //     return true;
  //   }

  //   return false;
  // }

  render() {
    //console.log('redner TimePointer');
    return <div className="time-pointer" style={{left: this.props.timePointerXPos}}> 
            <div className="time-pointer__stick" style={{height: this.props.timePointerHeight+"px"}}>
            </div>
          </div>
  }
}