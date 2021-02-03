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
        || this.props.tracksLength !== nextProps.tracksLength
        || this.props.trackControlWidth !== nextProps.trackControlWidth
        || this.props.style !== nextProps.style
        || this.props.ts !== nextProps.ts) {
        return true;
      }
      return false;
    }

    handleNoteClick = (noteIndex, newlevel) => {
      this.props.noteClick && this.props.noteClick(this.props.index, noteIndex, newlevel);
    }
  
    get Notes() {
      return this.props.track.notes;
    }

    onVolumeChange = (value) => {
      this.props.onVolumeChange && this.props.onVolumeChange(this.props.index, value);
    }

    renderNotes() {
      let els = []
      
      for (let i = 0; i < this.props.tracksLength; i++) {
  
        let indexInQuarter = i % 16 + 1;
        let filled = false;
        if ((indexInQuarter >= 5 && indexInQuarter <=8) || indexInQuarter >= 13) {
          filled = true;
        }
  
        // console.log(i, indexInQuarter, filled);
        const el = <Note key={i} index={i} filled={filled} width={this.props.noteWidth} 
                         noteHeight={this.props.noteHeight}
                         onClick={this.handleNoteClick} level={this.Notes[i] || 0}></Note>;
        els.push(el);
      }
  
      return els;
    }
  
    render() {
      console.log('Render Track');
  
      return <div className="workspace__track" style={{...this.props.style, height: this.props.noteHeight, width:this.props.noteWidth * this.props.tracksLength + this.props.trackControlWidth}}>
        <TrackControl track={this.props.track} width={this.props.trackControlWidth} height={this.props.noteHeight} onVolumeChange={this.onVolumeChange}/>
        {this.renderNotes()}
      </div>
    }
  }

  export default Track;