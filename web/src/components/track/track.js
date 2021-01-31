import React from "react";

import Note from "./note";

class Track extends React.PureComponent {
    // constructor(props) {
    //   super(props);
      
    // }
  
    handleNoteClick = (index, level) => {
      this.props.noteClick && this.props.noteClick(this.props.index, index, level);
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
                         onClick={this.handleNoteClick} level={this.props.notes[i] || 0}></Note>;
        els.push(el);
      }
  
      return els;
    }
  
    render() {
      console.log('Render Track');
  
      return <div className="workspace__track" style={{...this.props.style, height: this.props.noteHeight}}>
        {this.renderNotes()}
      </div>
    }
  }

  export default Track;