import React from "react";

import "./buttonAddTakt.css";

export default class ButtonAddTakt extends React.Component {  
    
    handleAddTakt = (e) => {
        console.log('Add takt');
        this.props.taktAdd();
    }

    render() {
      console.log('Render ButtonAddTakt');
      return <div className="takt-add" style={{width:this.props.addTaktButtonWidth, height: this.props.tracks.length * this.props.noteHeight + this.props.taktControlHeight + "px", marginTop: -this.props.tracks.length * this.props.noteHeight - this.props.taktControlHeight + "px"}}
        onClick={this.handleAddTakt}> 
        <div className="takt-add__content">+</div>           
    </div>
    }
  }