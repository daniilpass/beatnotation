import React from "react";

import "./timeline.css";

export default class Timeline extends React.Component {  
    onClick = (e) => {
        this.props.onClick && this.props.onClick(e);
    }

    
    get timePointerHeight() {
        return this.props.tracks.length * this.props.noteHeight + this.props.timePointerWidth;
    }
    
    render() {
      console.log('Render Timeline');
      return [<div key="timeline" className="timeline" style={{width:this.props.noteWidth * this.props.tracksLengthInNotes + "px", marginLeft: this.props.trackControlWidth+"px"}} onClick={this.onClick}>
        {
            [...Array(Math.ceil(this.props.tracksLengthInNotes / this.props.notesInTakt))].map((i,k) => {
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