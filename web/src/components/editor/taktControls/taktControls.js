import React from "react";

import "./taktControls.css";

export default class TaktControls extends React.Component {  
    
    shouldComponentUpdate(nextProps) {
        if (this.props.tracksLengthInTakts !== nextProps.tracksLengthInTakts
            || this.props.noteWidth !== nextProps.noteWidth
            || this.props.trackControlWidth !== nextProps.trackControlWidth
            || this.props.tracksLengthInNotes !== nextProps.tracksLengthInNotes
            || this.props.notesInTakt !== nextProps.notesInTakt) {
            return true;
        }
        return false;
    }
    
    handleDeleteClick = (taktIndex) => {
        console.log('Delete', taktIndex);
        this.props.taktDelete(taktIndex);
        if (this.props.realtimeRender) {
            this.props.renderNotes();
        }  
    }

    handleClearClick = (taktIndex) => {
        console.log('Clear', taktIndex);
        this.props.taktClear(taktIndex);
        if (this.props.realtimeRender) {
            this.props.renderNotes();
        }      
    }

    handleCopyClick = (taktIndex) => {
        console.log('Copy', taktIndex);
        this.props.taktCopy(taktIndex);
    }

    handlePasteClick = (taktIndex) => {
        console.log('Paste', taktIndex, this.props.clipboard);

        if (this.props.clipboard.length === 0) {
            console.log('Empty clipboard');
            return;
        }

        this.props.taktPaste(taktIndex);
        if (this.props.realtimeRender) {
            this.props.renderNotes();
        }  
    }

    get taktControlConatinerWidth() {
        return this.props.noteWidth * this.props.tracksLengthInNotes ;
    }
    
    get taktControlWidth() {
        return this.props.notesInTakt * this.props.noteWidth;
    }

    render() {
      console.log('Render TaktControls');
      return <div className="takt-controls" style={{width: this.taktControlConatinerWidth+ "px", marginLeft: this.props.trackControlWidth+"px"}}>
        {
            [...Array(Math.ceil(this.props.tracksLengthInTakts))].map((i,k) => {
            return <div key={k} className="takt-control" style={{width: this.taktControlWidth}}>
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