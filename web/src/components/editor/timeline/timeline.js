import React from "react";

import "./timeline.css";

export default class Timeline extends React.Component {  

    constructor(props) {
      super(props);

      this.loopDrag = false;   
    }

    shouldComponentUpdate(nextProps) {
      if (this.props.tracks.length !== nextProps.tracks.length
        || this.props.noteHeight !== nextProps.noteHeight
        || this.props.noteWidth !== nextProps.noteWidth
        || this.props.timePointerWidth !== nextProps.timePointerWidth
        || this.props.tracksLengthInNotes !== nextProps.tracksLengthInNotes
        || this.props.tracksLengthInTakts !== nextProps.tracksLengthInTakts
        || this.props.trackControlWidth !== nextProps.trackControlWidth
        || this.props.notesInTakt !== nextProps.notesInTakt
        || this.props.loopStart !== nextProps.loopStart
        || this.props.loopEnd !== nextProps.loopEnd
        || this.props.loop !== nextProps.loop
        /*|| this.props.bpm !== nextProps.bpm*/) {
        return true;
    }
    return false;
    }

    onClick = (e) => {
      if (this.loopDrag) {
        return;
      }
      this.props.onClick && this.props.onClick(e);
    }
    
    onLoopDragStarted = () => {
      this.loopDrag = true;
    }
    onLoopDragEnded = (left, right) => {           
      //pixels to time
      let loopStart = left / this.props.noteWidth / this.props.bpms / this.props.notesInPartCount;
      let loopEnd =  right / this.props.noteWidth / this.props.bpms / this.props.notesInPartCount;
      // update loop period
      this.props.setLoopPeriod(loopStart, loopEnd);
      // Скажу компоненту что перетаскивание цикла завершилось, использую таймаут чтобы выполнится после события родительского клика
      setTimeout(()=>{this.loopDrag = false}, 0);
    }


    get timePointerHeight() {
        return this.props.tracks.length * this.props.noteHeight + this.props.timePointerWidth;
    }
    
    get timelineWidth() {
      return this.props.noteWidth * this.props.tracksLengthInNotes;
    }

    get loopLeft() {
      return this.props.loopStart * this.props.bpms * this.props.notesInPartCount * this.props.noteWidth;
    }

    get loopWidth() {
      return (this.props.loopEnd - this.props.loopStart) * this.props.bpms * this.props.notesInPartCount * this.props.noteWidth;
    }

    render() {
      console.log('Render Timeline');
      return [<div key="timeline" className="timeline" style={{width:this.timelineWidth + "px", marginLeft: this.props.trackControlWidth+"px"}} onClick={this.onClick}>
        {
            [...Array(this.props.tracksLengthInTakts)].map((i,k) => {
            return <div key={k} className="timeline__takt" style={{width: this.props.notesInTakt * this.props.noteWidth}}>
                <div className="takt__number">{k+1}</div>
                </div>
            })
        }
        <LoopSelection onDragStarted={this.onLoopDragStarted} onDragEnded={this.onLoopDragEnded} active={this.props.loop}
                       minWidth={this.props.noteWidth*3} maxRightBorder={this.timelineWidth} left={this.loopLeft} width={this.loopWidth}/>
        </div>,        
        <div key="time-pointer" className="time-pointer" ref={this.props.timePointerRef}> 
          <div className="time-pointer__stick" style={{height: this.timePointerHeight+"px"}}>
          </div>
        </div>]
    }
  }

class LoopSelection extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      left: this.props.left || 0,
      width: this.props.width || 250
    }

    this.drag = {
      oldClientX: -1,
      started: false,
      left: false
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.left !== nextState.left
      || this.state.width !== nextState.width
      || this.props.left !== nextProps.left
      || this.props.width !== nextProps.width
      || this.props.minWidth !== nextProps.minWidth
      || this.props.maxRightBorder !== nextProps.maxRightBorder
      || this.props.active !== nextProps.active)
      return true;

    return false;
  }

  componentDidUpdate(prevProps) {
    if (this.props.left !== prevProps.left || this.props.width !== prevProps.width) {
        this.setState({left:this.props.left, width: this.props.width}) 
    }
  }

  onMouseDownLeft = (e) => {
    this.drag.left = true;
    //this.onMouseDown(e);
    this.drag.oldClientX = e.clientX;
    document.onmouseup = this.endDrag;
    document.onmousemove = this.dragLoop;
  }
  
  onMouseDownRight = (e) => {
    this.drag.left = false;
    //this.onMouseDown(e);
    this.drag.oldClientX = e.clientX;
    document.onmouseup = this.endDrag;
    document.onmousemove = this.dragLoop;
  }
  
  onMouseDown = (e) => {    
    e.preventDefault();

    this.drag.oldClientX = e.clientX;
    document.onmouseup = this.endDrag;
    document.onmousemove = this.dragLoop;
  }

  endDrag = (e) => {
    e.preventDefault();

    document.onmouseup = null;
    document.onmousemove = null;
    
    if (this.drag.started) {
      this.props.onDragEnded && this.props.onDragEnded(this.state.left, this.state.left+this.state.width);
    }
    this.drag.started = false;
  }

  dragLoop = (e) => {
    e.preventDefault();

    if (Math.abs(this.drag.oldClientX - e.clientX) >= 10) {
      this.drag.started = true;
      this.props.onDragStarted && this.props.onDragStarted()
    }

    if (!this.drag.started) {
      return;
    }     

    let deltaX = (this.drag.oldClientX - e.clientX);
    this.drag.oldClientX = e.clientX;

    let newLeft = this.state.left;
    let newWidth = this.state.width;

    if (this.drag.left) {
      newLeft = this.state.left - deltaX;
      newWidth = this.state.width + deltaX;      
    } else {
      newWidth = this.state.width - deltaX;
    }

    // Валидация значений
    if (newWidth < this.props.minWidth || newLeft < 0 || (newLeft+newWidth) > this.props.maxRightBorder ) {
      return;
    }

    this.setState({left: newLeft, width: newWidth}) 
    //if (newVolume <= this.maxVolume && newVolume >= 0) {
      
  }

  get left() {
    return (this.state.left > -1 ? this.state.left : this.props.left) || 0;
  }

  get width() {
    return (this.state.width > -1 ? this.state.width : this.props.width) || 50;
  }
  render() {
    //console.log("Render loop", this.state, this.props)
    return <div className={"loop-selection " + (this.props.active ? "loop-selection--active" : "loop-selection--disabled") } style={{left: this.left+"px", width: this.width+"px"}}>
      <div className="loop-selection__button loop-selection__button--left" onMouseDown={this.onMouseDownLeft}></div>
      <div className="loop-selection__button loop-selection__button--right" onMouseDown={this.onMouseDownRight}></div>
    </div>
  }
}