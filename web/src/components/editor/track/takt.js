import React from "react";

import Note from "./note";

export default class Takt extends React.Component {
    // constructor(props) {
    //   super(props)
    // }
  
    shouldComponentUpdate(nextProps, nextState) {    
      if (nextProps.takt.ts !== this.props.takt.ts
        || nextProps.noteWidth !== this.props.noteWidth
        || nextProps.timeSignature !== this.props.timeSignature){
        return true;
      }
  
      return false;
    }
  
    handleNoteClick = (noteIndex, newlevel) => {
      this.props.onNoteClick && this.props.onNoteClick(this.props.index, noteIndex, newlevel);
    }
  
    renderNotes() {
      //console.log('renderNotes', this.props.takt);
      //let notesInPart = 0;
      let notesInGroup = 0;
  
      let up = this.props.timeSignature[0];
      let down = this.props.timeSignature[1];
      // switch (down) {
      //   case 4: notesInPart = 4; break;
      //   case 8: notesInPart = 2; break;
      //   case 16: notesInPart = 1; break;
      //   default:
      //     throw ("Unknown timeSignature:", this.state.timeSignature);
      // }
  
      if (down === 8 && (up % 3) === 0) {
        notesInGroup = 6;
      } else {
        notesInGroup = 4;
      }
  
      //Если в тактах нечетное кол-во долей, то шахматный рисунок сбивается. Исправим
      let shiftFill = false;
      if (up % 2 !== 0 && this.props.index % 2 === 1) {
        shiftFill = true;
        //console.log("use shift")
      }
  
  
      let els = []
      let notes = this.props.takt.notes;
      for (let i = 0; i < notes.length; i++) {
  
      //  let indexInQuarter = i % 16 + 1;
        let filled = i % (notesInGroup*2) >= notesInGroup;
        if (shiftFill) {
          filled = !filled;
        }
        // if ((indexInQuarter >= 5 && indexInQuarter <=8) || indexInQuarter >= 13) {
        //   filled = true;
        // }
  
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