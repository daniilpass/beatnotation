import React from "react";

class TrackControl extends React.PureComponent {
    constructor(props) {
      super(props);      
    }
    render() {
      console.log('Render Track');
  
      return <div className="workspace__track" style={{...this.props.style, height: this.props.noteHeight}}>
      </div>
    }
  }

  export default Track;