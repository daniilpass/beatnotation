import React from "react";


import TrackControl from "./trackControl";
import Takt from "./takt";
import AudioTrackVisualization from "./audioTrackVisualization";

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
        || this.props.notesInPartCount !== nextProps.notesInPartCount
        || this.props.canImportAudio !== nextProps.canImportAudio) {
        return true;
      }
      return false;
    }
  
    get Notes() {
      return this.props.track.notes;
    }

    handleLoadClick = () => {
      this.fileReaderRef.current.selectFile();
    }
  
    handleFileLoaded = (buffer) => {
      this.props.onUserAudioLoaded && this.props.onUserAudioLoaded(this.props.index, buffer);
    }

    handleNoteClick = (taktIndex, noteIndex, newlevel) => {
      this.props.noteClick && this.props.noteClick(this.props.index, taktIndex, noteIndex, newlevel);
    }

    onVolumeChange = (value) => {
      this.props.onVolumeChange && this.props.onVolumeChange(this.props.index, value);
    }

    onTrackIsMute = () => {
      this.props.onTrackIsMute && this.props.onTrackIsMute(this.props.index);
    }

    onClearTrack = () => {
      this.props.onClearTrack && this.props.onClearTrack(this.props.index)
    }

    renderTrack() {
      if (this.props.track.type !== 0) {
        return this.renderTakts()
      } else {
        return [
          <AudioTrack key={"audioTrack"+this.props.index} {...this.props} loaded={this.props.track.loaded}/>,
          <UserFileReader key={"audioTrackloader"+this.props.index}  ref={this.fileReaderRef} onFileLoaded={this.handleFileLoaded} readAsArrayBuffer accept=".WAV, .MP3, .AAC, .OGG"/>
        ]
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
                      onLoadClick={this.handleLoadClick} onTrackIsMute={this.onTrackIsMute} canImportAudio={this.props.canImportAudio}
                      onClearTrack={this.onClearTrack}/>
        {
          this.renderTrack()
        }           
      </div>
    }
  }


class AudioTrack extends React.Component {
  // constructor(props) {
  //   super(props);
  // }

  shouldComponentUpdate(nextProps) {
    if (this.props.noteWidth !== nextProps.noteWidth
      || this.props.tracksLengthInNotes !== nextProps.tracksLengthInNotes
      || this.props.loaded !== nextProps.loaded
      || this.props.bpms !== nextProps.bpms 
      || this.props.notesInPartCount !== nextProps.notesInPartCount 
      || this.props.track.offset !== nextProps.track.offset) {
      return true;
    }
    return false;
  }

  handlePositionChanged = (position) => {
    let offset = position / this.props.noteWidth / this.props.bpms / this.props.notesInPartCount;   
    this.props.setTrackOffset(this.props.index, offset);
  }

  get width() {
    return this.props.noteWidth * this.props.tracksLengthInNotes;
  }

  get trackLoaded() {
    return this.props.loaded;
  }

  get vPosition() {
    return this.props.track.offset * this.props.bpms * this.props.notesInPartCount * this.props.noteWidth;
  }

  render() {
    console.log("Render AudioTrack");
    return [
    <div key="user-audio-track" className={"user-audio-track" + (this.trackLoaded ? " user-audio-track-loaded" : "")} style={{width: this.width + "px"}}>
      <AudioTrackVisualization {...this.props} parentWidth={this.width} position={this.vPosition} onPositionChanged={this.handlePositionChanged}/>
    </div>]
  }
}
