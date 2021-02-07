import React from "react";

import "./taktControls.css";

export default class TaktControls extends React.Component {   
    handleDeleteClick = (taktIndex) => {
        console.log('Delete', taktIndex);
        this.props.taktDelete(taktIndex)  
    }

    handleClearClick = (taktIndex) => {
        console.log('Clear', taktIndex);
        this.props.taktClear(taktIndex)    
    }

    handleCopyClick = (taktIndex) => {
        console.log('Copy', taktIndex);
        this.props.taktCopy(taktIndex)
    }

    handlePasteClick = (taktIndex) => {
        console.log('Paste', taktIndex, this.props.clipboard);

        if (this.props.clipboard.length === 0) {
        console.log('Empty clipboard');
        return;
        }

        this.props.taktPaste(taktIndex);
    }

    render() {
      console.log('Render TaktControls');
      return <div className="takt-controls" style={{width:this.props.noteWidth * this.props.tracksLengthInNotes + "px", marginLeft: this.props.trackControlWidth+"px"}}>
        {
            [...Array(Math.ceil(this.props.tracksLengthInTakts))].map((i,k) => {
            return <div key={k} className="takt-control" style={{width: this.props.notesInTakt * this.props.noteWidth}}>
                <button className="takt-control__button button" onClick={this.handlePasteClick.bind(this, k)}>Paste</button>
                <button className="takt-control__button button" onClick={this.handleCopyClick.bind(this, k)}>Copy</button>
                <button className="takt-control__button button" onClick={this.handleClearClick.bind(this, k)}>Clear</button>
                <button className="takt-control__button button" onClick={this.handleDeleteClick.bind(this, k)}>Delete</button>
                <div style={{clear: "both"}}></div>
                </div>
            })
        }
        </div>
    }
  }