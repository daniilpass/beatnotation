import React from "react";

class Note extends React.Component {  
  constructor(props) {
    super(props);

    this.state = {
      level: 0
    }
  }

  get width(){
    return this.props.width;
  }

  get posX() {
    return this.props.index * this.props.width;
  }


  shouldComponentUpdate(nextProps, nextSate) {
    // console.log('shouldComponentUpdate Note');
    
    // Пришло обновление ноты из вне
    if (nextProps.level !== this.props.level && nextProps.level !== this.state.level) {
      //console.log('update note from parent. Note index:' + this.props.index,'new level:',nextProps.level, 'old level:', this.props.level, this.state.level)
      this.setState({level: nextProps.level});
      return true;
    }

    if (this.state.level !== nextSate.level){
      //console.log('update note by self')
      return true;
    }
      
    
      return false;
  }

  componentDidUpdate(prevProps, prevState) {
    //console.log('componentDidUpdate note');
  }

  handleClick = () => {  
    let newlevel = this.state.level == 1 ? 0 : 1;
    this.setState({level: newlevel})
    this.props.onClick && this.props.onClick(this.props.index, newlevel);
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