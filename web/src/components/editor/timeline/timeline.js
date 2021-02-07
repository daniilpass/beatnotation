import React from "react";

import "./timeline.css";

export default class Timeline extends React.Component {  

    shouldComponentUpdate(nextProps) {
      if (this.props.tracks.length !== nextProps.tracks.length
        || this.props.noteHeight !== nextProps.noteHeight
        || this.props.noteWidth !== nextProps.noteWidth
        || this.props.timePointerWidth !== nextProps.timePointerWidth
        || this.props.tracksLengthInNotes !== nextProps.tracksLengthInNotes
        || this.props.tracksLengthInTakts !== nextProps.tracksLengthInTakts
        || this.props.trackControlWidth !== nextProps.trackControlWidth
        || this.props.notesInTakt !== nextProps.notesInTakt) {
        return true;
    }
    return false;
    }

    onClick = (e) => {
        this.props.onClick && this.props.onClick(e);
    }
    
    get timePointerHeight() {
        return this.props.tracks.length * this.props.noteHeight + this.props.timePointerWidth;
    }
    
    get timelineWidth() {
      return this.props.noteWidth * this.props.tracksLengthInNotes;
    }

    render() {
      console.log('Render Timeline');
      return [<div key="timeline" className="timeline" style={{width:this.timelineWidth + "px", marginLeft: this.props.trackControlWidth+"px"}} onClick={this.onClick}>
        {
            [...Array(this.props.tracksLengthInTakts)].map((i,k) => {
            return <div key={k} className="timeline__takt" style={{width: this.props.notesInTakt * this.props.noteWidth}}>
                <div className="takt__number">{k+1}</div>
                </div>
            })
        }
        </div>,        
        <div key="time-pointer" className="time-pointer" ref={this.props.timePointerRef}> 
          <div className="time-pointer__stick" style={{height: this.timePointerHeight+"px"}}>
          </div>
        </div>]
    }
  }