import React from "react";

import Note from "./note";
import TrackControl from "./trackControl";

class Track extends React.Component {
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

    renderTakts() {
      let els = [];
      for (let i = 0; i < this.props.tracksLengthInTakts; i++) {
        const takt = this.props.track.takts[i];
        const el = <Takt key={"takt_"+i} noteWidth={this.props.noteWidth} noteHeight={this.props.noteHeight} 
          takt={takt} index={i} tracksLengthInTakts={this.props.tracksLengthInTakts} onNoteClick={this.handleNoteClick}/>

        els.push(el);
      }

      return els;
    }
  
    render() {
      console.log('Render Track');
  
      return <div className="workspace__track" style={{...this.props.style, height: this.props.noteHeight, width:this.props.noteWidth * this.props.tracksLengthInNotes + this.props.trackControlWidth}}>
        <TrackControl track={this.props.track} width={this.props.trackControlWidth} height={this.props.noteHeight} onVolumeChange={this.onVolumeChange} maxVolume={100}/>
        {this.renderTakts()}
        
      </div>
    }
  }

  export default Track;

class Takt extends React.Component {
  // constructor(props) {
  //   super(props)
  // }

  shouldComponentUpdate(nextProps, nextState) {    
    if (nextProps.takt.ts !== this.props.takt.ts
      || nextProps.noteWidth !== this.props.noteWidth){
      return true;
    }

    return false;
  }

  handleNoteClick = (noteIndex, newlevel) => {
    this.props.onNoteClick && this.props.onNoteClick(this.props.index, noteIndex, newlevel);
  }

  renderNotes() {
    //console.log('renderNotes', this.props.takt);
    
    let els = []
    let notes = this.props.takt.notes;
    for (let i = 0; i < notes.length; i++) {

      let indexInQuarter = i % 16 + 1;
      let filled = false;
      if ((indexInQuarter >= 5 && indexInQuarter <=8) || indexInQuarter >= 13) {
        filled = true;
      }

      // console.log(i, indexInQuarter, filled);
      const el = <Note key={i} index={i} filled={filled} width={this.props.noteWidth} 
                       noteHeight={this.props.noteHeight}
                       onClick={this.handleNoteClick} level={notes[i] || 0}></Note>;
      els.push(el);
    }

    return els;
  }

  render() {
    //console.log('Render Takt', this.props.index);
    return <div className="workspace__track__takt">{this.renderNotes()}</div>
  }
}