import React from "react";

class Note extends React.Component {  
    get width(){
      return this.props.width;
    }
  
    get posX() {
      return this.props.index * this.props.width;
    }
  

    shouldComponentUpdate(prevProps) {
      // console.log('shouldComponentUpdate Note');
      if (this.props.level !== prevProps.level)
        return true;
      
        return false;
    }

    componentDidUpdate(prevProps, prevState) {
      console.log('componentDidUpdate note');
    }

    handleClick = () => {  
      this.props.onClick && this.props.onClick(this.props.index);
    }
  
    render() {
      //console.log('Render Note');
      return <div className={"note " + (this.props.filled ? "note_filled " : "") + ("note_level_" + this.props.level)} 
                  style={{width: this.width + 'px', left: this.posX, height: this.props.noteHeight}}
                  onClick={this.handleClick}>      
      </div>
    }
  }

  export default Note;