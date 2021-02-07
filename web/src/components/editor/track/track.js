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
        || this.props.ts !== nextProps.ts) {
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
    console.log(buffer);
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
    <div key="user-audio" className={"user-audio" + (this.trackLoaded ? " user-audio-loaded" : "")} style={{width: this.width + "px"}} onClick={this.handeAudioClick}></div>,
    <UserFileReader key="user-audio-loader"  ref={this.fileReaderRef} onFileLoaded={this.handleFileLoaded} readAsArrayBuffer/>]
  }
}