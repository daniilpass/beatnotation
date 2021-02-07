import React from "react";


import TrackControl from "./trackControl";
import Takt from "./takt";
import UserFileReader from "../../userFileReader/userFileReader";

export default class Track extends React.Component {
    // constructor(props) {
    //   super(props);
      
    // }
  
    shouldComponentUpdate(nextProps, nextState){
      if (this.props.trackControlWidth !== nextProps.trackControlWidth
        || this.props.noteHeight !== nextProps.noteHeight
        || this.props.noteWidth !== nextProps.noteWidth
        || this.props.tracksLengthInTakts !== nextProps.tracksLengthInTakts
        || this.props.tracksLengthInNotes !== nextProps.tracksLengthInNotes
        || this.props.trackControlWidth !== nextProps.trackControlWidth
        || this.props.timeSignature !== nextProps.timeSignature
        || this.props.style !== nextProps.style
        || this.props.ts !== nextProps.ts
        || this.props.bpms !== nextProps.bpms
        || this.props.notesInPartCount !== nextProps.notesInPartCount) {
        return true;
      }
      return false;
    }

    handleNoteClick = (taktIndex, noteIndex, newlevel) => {
      this.props.noteClick && this.props.noteClick(this.props.index, taktIndex, noteIndex, newlevel);
    }
  
    get Notes() {
      return this.props.track.notes;
    }

    onVolumeChange = (value) => {
      this.props.onVolumeChange && this.props.onVolumeChange(this.props.index, value);
    }

    renderTrack() {
      if (this.props.track.type !== 0) {
        return this.renderTakts()
      } else {
        return <AudioTrack {...this.props} loaded={this.props.track.loaded}/>
      }
    }

    renderTakts() {
      let els = [];
      for (let i = 0; i < this.props.tracksLengthInTakts; i++) {
        const takt = this.props.track.takts[i];
        const el = <Takt key={"takt_"+i} noteWidth={this.props.noteWidth} noteHeight={this.props.noteHeight} 
          timeSignature={this.props.timeSignature}
          takt={takt} index={i} tracksLengthInTakts={this.props.tracksLengthInTakts} onNoteClick={this.handleNoteClick}/>

        els.push(el);
      }

      return els;
    }
  
    render() {
      console.log('Render Track');
  
      return <div className="workspace__track" style={{...this.props.style, height: this.props.noteHeight, width:this.props.noteWidth * this.props.tracksLengthInNotes + this.props.trackControlWidth}}>
        <TrackControl track={this.props.track} width={this.props.trackControlWidth} height={this.props.noteHeight} onVolumeChange={this.onVolumeChange} maxVolume={100}/>
        {
          this.renderTrack()
        }        
      </div>
    }
  }


class AudioTrack extends React.Component {
  constructor(props) {
    super(props);

    this.fileReaderRef = React.createRef();
  }

  shouldComponentUpdate(nextProps) {
    if (this.props.noteWidth !== nextProps.noteWidth
      || this.props.tracksLengthInNotes !== nextProps.tracksLengthInNotes
      || this.props.loaded !== nextProps.loaded) {
      return true;
    }
    return false;
  }

  handeAudioClick = () => {
    this.fileReaderRef.current.selectFile();
  }

  handleFileLoaded = (buffer) => {
    console.log("user audio loaded");
    //console.log(buffer);
    this.props.loadUserAudio(this.props.index, buffer);
  }

  get width() {
    return this.props.noteWidth * this.props.tracksLengthInNotes;
  }

  get trackLoaded() {
    return this.props.loaded;
  }

  render() {
    return [
    <div key="user-audio" className={"user-audio" + (this.trackLoaded ? " user-audio-loaded" : "")} style={{width: this.width + "px"}} onClick={this.handeAudioClick}>
      <AudioTrackVisualization {...this.props}/>
    </div>,
    <UserFileReader key="user-audio-loader"  ref={this.fileReaderRef} onFileLoaded={this.handleFileLoaded} readAsArrayBuffer/>]
  }
}

class AudioTrackVisualization extends React.Component {
  constructor(props){
    super(props);
    this.rednerMultiplayer = 1;
  }
  
  shouldComponentUpdate(nextProps) {
    if (this.props.loaded !== nextProps.loaded
      || this.props.bpms !== nextProps.bpms 
      || this.props.notesInPartCount !== nextProps.notesInPartCount 
      || this.props.noteWidth !== nextProps.noteWidth) {
      return true;
    }
    return false;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.loaded === false && this.props.loaded === true) {      
      //this.visualize("audio_canvas", 1);
      this.visualize("audio_canvas_inside", this.rednerMultiplayer);
    } else if (this.props.loaded === true 
      && (this.props.bpms !== prevProps.bpms || this.props.notesInPartCount !== prevProps.notesInPartCount || this.props.noteWidth !== prevProps.noteWidth)) {
      this.visualize("audio_canvas_inside", this.rednerMultiplayer);
    }
  }

  get track() {
    return this.props.track;
  }

  //TODO: improve
  visualize (canvas_name, di) {
    console.log("Visualize");
    const canvas  = document.getElementById(canvas_name);
    const canvasCtx = canvas.getContext('2d');

    //Вычисляю длину холста
    //canvas.width = this.props.
    let durationInMs  = this.track.audioBuffer.duration * 1000;
    let lengthInPx = durationInMs * this.props.bpms * this.props.notesInPartCount *  this.props.noteWidth ;
    //console.log("===========>", durationInMs, this.props.bpms, this.props.notesInPartCount,  this.props.noteWidth, lengthInPx);
    console.log("canvas width in px:", lengthInPx)
    canvas.width = lengthInPx;

    // get timelineNote() {
    //   return this.timestamp * this.props.bpms * this.props.notesInPartCount;
    // }
  
    // get timePointerXPos() {
    //   return this.timelineNote * this.props.noteWidth - this.props.timePointerWidth/2 + 2 + this.props.trackControlWidth;
    // }


    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    const audioBuffer = this.props.track.audioBuffer

    //Анализатор
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;

    const bufferLength = audioBuffer.getChannelData(0).length;
    var dataArray = new Float32Array(audioBuffer.getChannelData(0));
    analyser.getFloatTimeDomainData(dataArray);

    //console.log(dataArray.length, bufferLength, dataArray);

    var sliceWidth = WIDTH / bufferLength;
    var x = 0;
    var dy = canvas.height / 2;

    canvasCtx.beginPath();
    canvasCtx.fillStyle =  "#FF8E00";
    canvasCtx.fillRect(0,0,WIDTH,HEIGHT);
    canvasCtx.stroke();
    //canvasCtx.clearRect(0,0,WIDTH,HEIGHT);

    canvasCtx.fillStyle = "#ffffff";
    canvasCtx.strokeStyle = "#ffffff";
    canvasCtx.lineWidth = 1;

    for(var i = 0; i < bufferLength; i = i + di) {
        // var v = dataArray[i] * 2;
        // var y = v + (HEIGHT / 4.0); // Dividing height by 4 places the waveform in the center of the canvas for some reason

        var v = dataArray[i];
        var y = dy + v * ((HEIGHT-4)/2);

        if(i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth * di;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  }  

  render() {
    return <canvas id="audio_canvas_inside" width={this.width + "px"} height={this.props.noteHeight}></canvas>
  }
  
}