import React from "react";

class TrackControl extends React.PureComponent {
    constructor(props) {
      super(props);      
    }

    get Title(){
        return this.props.track.title;
    }

    render() {  
      return <div className="track-control" style={{width: this.props.width, height: this.props.height}}>
          <div className="track-control__title" style={{lineHeight: this.props.height-2+"px"}}>{this.Title}</div>
      </div>
    }
  }

  export default TrackControl;