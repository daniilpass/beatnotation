import React from "react";

class TrackControl extends React.PureComponent {
    constructor(props) {
      super(props);      
    }

    render() {  
      return <div className="track-control" style={{width: this.props.width}}>
      </div>
    }
  }

  export default TrackControl;