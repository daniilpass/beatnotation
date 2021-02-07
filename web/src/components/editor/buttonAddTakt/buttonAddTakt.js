import React from "react";

import "./buttonAddTakt.css";

export default class ButtonAddTakt extends React.Component {  
    
    shouldComponentUpdate(nextProps) {
      if (this.props.addTaktButtonWidth !== nextProps.addTaktButtonWidth
        || this.props.tracks.length !== nextProps.tracks.length
        || this.props.noteHeight !== nextProps.noteHeight
        || this.props.taktControlHeight !== nextProps.taktControlHeight) {
          return true;
      }
      return false;
    }

    handleAddTakt = (e) => {
        console.log('Add takt');
        this.props.taktAdd();
    }

    get width() {
      return this.props.addTaktButtonWidth;
    }

    get height() {
      return this.props.tracks.length * this.props.noteHeight + this.props.taktControlHeight;
    }

    render() {
      console.log('Render ButtonAddTakt');
      return <div className="takt-add" style={{width: this.width, height: this.height + "px", marginTop: -this.height + "px"}}
        onClick={this.handleAddTakt}> 
        <div className="takt-add__content">+</div>           
    </div>
    }
  }