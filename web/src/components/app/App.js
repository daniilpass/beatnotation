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
import SoundBass from '../../assets/sounds/bassdrum.mp3';
import SoundTomHi from '../../assets/sounds/tom_hi.mp3';
import SoundTomMid from '../../assets/sounds/tom_mid.mp3';
import SoundTomLow from '../../assets/sounds/tom_low.mp3';


class App extends React.Component {
  constructor(props){
      super(props);

      this.timerId = 0;
      this.stepDelay = 10;
      this.partWidth = 20;
      this.defaultBpm = 120;
      this.notesInPartCount = 4;
      this.tracksLength = 1280;
      this.prevNoteIndex = -1;
      this.timePointerWidth = 10;
      this.noteHeight = 31;
      this.trackControlWidth = 200;
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
      this.tracks[3].notes[0] = 1; this.tracks[3].notes[4] = 1; this.tracks[3].notes[8] = 1; this.tracks[3].notes[12] = 1; 
      this.tracks[3].notes[16] = 1; this.tracks[3].notes[20] = 1; this.tracks[3].notes[24] = 1; this.tracks[3].notes[28] = 1; 
      this.tracks[3].notes[32] = 1; this.tracks[3].notes[36] = 1; this.tracks[3].notes[40] = 1; this.tracks[3].notes[44] = 1; 
      this.tracks[3].notes[48] = 1; this.tracks[3].notes[52] = 1; this.tracks[3].notes[56] = 1; this.tracks[3].notes[60] = 1;
      this.tracks[3].notes[64] = 1; this.tracks[3].notes[68] = 1; this.tracks[3].notes[72] = 1; this.tracks[3].notes[76] = 1;
      this.tracks[4].notes[4] = 1; this.tracks[4].notes[12] = 1; this.tracks[4].notes[20] = 1;  this.tracks[4].notes[28] = 1;
      this.tracks[8].notes[0] = 1; this.tracks[8].notes[6] = 1; this.tracks[8].notes[10] = 1;
      this.tracks[8].notes[16] = 1; this.tracks[8].notes[22] = 1; 

      this.state = {
        timestamp: 0,
        bpm: this.defaultBpm,
        bpms: this.defaultBpm / 60 / 1000,
        state: "stop",
        connect: true
      }

      this.canvasRef = React.createRef();
      this.tracksContainerRes = React.createRef();
  }
 

  componentDidMount () {
    document.addEventListener("keyup", this.handleKeyDown);
    document.addEventListener('keydown', function (e) {
        if (e.keyCode === 32) {
            e.preventDefault();
        }
    }, false)
    this.tryDrawNotes();
  }

  componentDidUpdate() {
    this.tryDrawNotes();
  }

  componentWillUnmount () {
    document.removeEventListener("keyup", this.handleKeyDown);
  }

  tryDrawNotes() {
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
        if (this.state.state === "play" || this.state.state === "pause") {
          this.stop();
        } 
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
    this.timerId = setInterval(this.step, this.stepDelay);

    this.setState({
      state: "play"
    })    
  }

  stop = () => {
    console.log("stop");

    clearInterval(this.timerId);

    this.setState({
      timestamp: 0,
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
    this.setState((state) =>  { 
      return {
        timestamp: state.timestamp + this.stepDelay
      };
    });

    this.playNotes();
  }

  playNotes = () => {
    let noteIndex = Math.trunc(this.part);

    if (noteIndex === this.prevNoteIndex)
      return;

    //console.log(noteIndex);
    for (let trackIndex = 0; trackIndex < this.tracks.length; trackIndex++) {
      const track = this.tracks[trackIndex];
      if (track.notes[noteIndex] > 0) {
        // console.log('Play note', trackIndex, noteIndex, track.audioUrl); 
        let audio = new Audio(track.audioUrl);
        audio.volume = track.volume;
        audio.play();
        // track.audio.stop();    
        // track.audio.play();
      }
    }    

    this.prevNoteIndex = noteIndex;
  }

  get timePointerXPos() {
    return this.part * this.partWidth - this.timePointerWidth/2 + 2 + this.trackControlWidth;
  }

  get timePointerHeight() {
    return this.tracks.length * this.noteHeight + this.timePointerWidth;
  }

  get part() {
    return this.state.timestamp * this.state.bpms * this.notesInPartCount;
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
    console.log(event.target.checked);
    this.setState({
      [event.target.name]: event.target.checked,
    }) 
  }

  handleNoteClick = (trackIndex, noteIndex, level) => {
    let track = this.tracks[trackIndex];
    track.notes[noteIndex] = level;
    //console.log(trackIndex, noteIndex, level, this.tracks);

    this.tryDrawNotes();
  }

  get getFormattedTime() {
    let ms = this.state.timestamp % 1000;
    let sec = Math.trunc(this.state.timestamp / 1000) % 60;
    let min = Math.trunc(this.state.timestamp / 1000 / 60)
    return (min+'').padStart(2,"0") + ":" +(sec+'').padStart(2,"0") + "." + (ms+'').padStart(3,"0")
  }

  render () {
    //console.log('Render App');

    return <div className="App">
      <header className="App-header no-print">
        Beat maker
      </header>

      <div className="app-toolbar no-print">
        <button className="app-toolbar__button" onClick={this.play} disabled={this.state.state === "play"}>Play</button>
        <button className="app-toolbar__button" onClick={this.stop} disabled={this.state.state === "stop"}>Stop</button>
        <button className="app-toolbar__button" onClick={this.pause} disabled={this.state.state === "pause" || this.state.state === "stop"}>Pause</button>
        <button className="app-toolbar__button" onClick={this.print}>Print notes</button>
        
        {/* <div className="app-toolbar__part" >
          Part: {Math.trunc(this.part) + 1 }
        </div> */}

        <div className="app-toolbar__bpm" >
          BPM: 
          <input name="bpm" value={this.state.bpm} onChange={this.handleBpmInputChange} type="number"></input>
        </div>
        <div className="app-toolbar__time" >
          Time: {this.getFormattedTime}
        </div>

        {/* <div>
          Connect notes: 
          <input name="connect" value={this.state.connect} onChange={this.handleBooleanInputChange} checked={this.state.connect} type="checkbox"></input>
        </div> */}
        
      </div>

      <div className="workspace no-print"> 
        
        <div className="track-container" ref={this.tracksContainerRes}>
          <div className="time-pointer" style={{left: this.timePointerXPos}}> 
            <div className="time-pointer__stick" style={{height: this.timePointerHeight+"px"}}>
            </div>
          </div>
          {
            this.tracks.map((_track,i) => {
              return <Track key={"track_"+i} index={i} noteWidth={this.partWidth} noteHeight={this.noteHeight} noteClick={this.handleNoteClick} 
                              tracksLength={this.tracksLength} track={_track} trackControlWidth={this.trackControlWidth}
                              />
            })
          }
        </div>
        
       
      </div>

       <CanvasNotes ref={this.canvasRef} />
    </div>
  }
}

export default App;
