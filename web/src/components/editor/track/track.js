import React from "react";


import TrackControl from "./trackControl";
import Takt from "./takt";
import UserFileReader from "../../userFileReader/userFileReader";

export default class Track extends React.Component {
    constructor(props) {
      super(props);     

      this.fileReaderRef = React.createRef(); 
    }
  
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

    handleLoadClick = () => {
      this.fileReaderRef.current.selectFile();
    }
  
    handleFileLoaded = (buffer) => {
      console.log("user audio loaded");
      //console.log(buffer);
      this.props.loadUserAudio(this.props.index, buffer);
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
        <TrackControl track={this.props.track} width={this.props.trackControlWidth} height={this.props.noteHeight} onVolumeChange={this.onVolumeChange} maxVolume={100} 
                      onLoadClick={this.handleLoadClick}/>
        {
          this.renderTrack()
        }
        <UserFileReader key="user-audio-track-loader"  ref={this.fileReaderRef} onFileLoaded={this.handleFileLoaded} readAsArrayBuffer accept=".mp3"/>     
      </div>
    }
  }


class AudioTrack extends React.Component {
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate(nextProps) {
    if (this.props.noteWidth !== nextProps.noteWidth
      || this.props.tracksLengthInNotes !== nextProps.tracksLengthInNotes
      || this.props.loaded !== nextProps.loaded) {
      return true;
    }
    return false;
  }

  get width() {
    return this.props.noteWidth * this.props.tracksLengthInNotes;
  }

  get trackLoaded() {
    return this.props.loaded;
  }

  render() {
    return [
    <div key="user-audio-track" className={"user-audio-track" + (this.trackLoaded ? " user-audio-track-loaded" : "")} style={{width: this.width + "px"}}>
      <AudioTrackVisualization {...this.props}/>
    </div>]
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

  filterData = (_buffer, _samples) => {
    const rawData = _buffer;
    const samples = _samples;
    const blockSize = Math.floor(rawData.length / samples);
    const filteredData = [];
    for (let i = 0; i < samples; i++) {
      filteredData.push(rawData[i * blockSize]); 
    }
    return filteredData;
  }

  visualize = (canvas_name) => {
    console.log("Visualize");
    //Пуолчаю холст
    const canvas  = document.getElementById(canvas_name);
    const canvasCtx = canvas.getContext('2d');

    //Вычисляю и задаю новую длину холста
    let durationInMs  = this.track.audioBuffer.duration * 1000;
    let lengthInPx = durationInMs * this.props.bpms * this.props.notesInPartCount *  this.props.noteWidth;
    canvas.width = lengthInPx;

    //Константы размеров холста
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    //Полдготовка данных
    var dataArrayRaw = this.props.track.audioBuffer.getChannelData(0);    
    let dataArray = this.filterData(dataArrayRaw, dataArrayRaw.length / 256);
    let bufferLength = dataArray.length;
    //TODO: Нормализовать тихие дорожки

    var sliceWidth = WIDTH / bufferLength;
    var x = 0;
    var dy = HEIGHT / 2;
    
    //clear
    canvasCtx.beginPath();
    canvasCtx.fillStyle =  "#FF8E00";
    canvasCtx.fillRect(0,0,WIDTH,HEIGHT);
    canvasCtx.stroke();
    //init brush
    canvasCtx.fillStyle = "#ffffff";
    canvasCtx.strokeStyle = "#ffffff";
    // canvasCtx.lineWidth = 3;
    //draw
    let maxVal = 0
    for(var i = 0; i < bufferLength; i = i + 1) {
      var v = dataArray[i];
      var y = dy + v * dy;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }
      x += sliceWidth;

      if (v > maxVal)
        maxVal = v;
    }
    //fill
    canvasCtx.lineTo(WIDTH, dy);
    canvasCtx.stroke();
  }  

  render() {
    return <canvas id="audio_canvas_inside" className="user-audio-visualization" width="0" height={this.props.noteHeight}></canvas>
  }
  
}