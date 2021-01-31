import React from "react";

class Note extends React.PureComponent {
    constructor(props) {
      super(props);
      
      this.state = {
        level: this.props.level
      }
    }
  
    get width(){
      return this.props.width;
    }
  
    get posX() {
      return this.props.index * this.props.width;
    }
  
    handleClick = () => {
      let newLevel =  this.state.level === 1 ? 0 : 1;
      this.setState({
        level: newLevel
      });
  
      this.props.onClick && this.props.onClick(this.props.index, newLevel);
    }
  
    render() {
      //console.log('Render Note');
      return <div className={"note " + (this.props.filled ? "note_filled " : "") + ("note_level_" + this.state.level)} 
                  style={{width: this.width + 'px', left: this.posX, height: this.props.noteHeight}}
                  onClick={this.handleClick}>      
      </div>
    }
  }

  export default Note;