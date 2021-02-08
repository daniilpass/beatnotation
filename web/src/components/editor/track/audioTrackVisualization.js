import React from "react";

export default class AudioTrackVisualization extends React.Component {
    constructor(props){
      super(props);
  
      this.state = {
        tmpPosition: 0
      }
  
      this.drag = {
        oldClientY: -1
      }
  
      this.canvasRef = React.createRef();
    }  
  
    componentDidMount() {
      this.canvasRef.current.onmousedown = this.dragMouseDown;
    }
  
    shouldComponentUpdate(nextProps, nextState) {
      if (this.props.loaded !== nextProps.loaded
        || this.props.bpms !== nextProps.bpms 
        || this.props.notesInPartCount !== nextProps.notesInPartCount 
        || this.props.noteWidth !== nextProps.noteWidth
        || this.state.tmpPosition !== nextState.tmpPosition
        || this.props.track.offset !== nextProps.track.offset) {
        return true;
      }
      return false;
    }
  
    componentDidUpdate(prevProps) {
      if (prevProps.loaded === false && this.props.loaded === true) {      
        //this.visualize("audio_canvas", 1);
        this.visualize("audio_canvas_inside");
      } else if (this.props.loaded === true 
        && (this.props.bpms !== prevProps.bpms || this.props.notesInPartCount !== prevProps.notesInPartCount || this.props.noteWidth !== prevProps.noteWidth)) {
        this.visualize("audio_canvas_inside");
      }
    }
  
    dragMouseDown = (e) => {
      e.preventDefault();
  
      this.setState({tmpPosition: this.props.track.offset || 0})
      this.drag.oldClientX = e.clientX;
  
      document.onmouseup = this.closeDragElement;
      document.onmousemove = this.dragCanvas;
    }
  
    closeDragElement = (e) => {
      e.preventDefault();
      document.onmouseup = null;
      document.onmousemove = null;
      this.props.setTrackOffset(this.props.index, this.state.tmpPosition);
      this.setState({tmpPosition: -1})
    }
  
    dragCanvas = (e) => {
      e.preventDefault();
  
      let deltaX = (this.drag.oldClientX - e.clientX)
      this.drag.oldClientX = e.clientX;
  
      //change pos
      let newPosition = this.state.tmpPosition - deltaX;
      if (newPosition >= 0 && (newPosition + this.props.noteWidth) <= this.props.parentWidth) {
        this.setState({tmpPosition: newPosition})
        //requestAnimationFrame( () => { this.setState({tmpPosition: newPosition}) } );
      }
    }
  
    get offset() {
      return this.state.tmpPosition > -1 ? this.state.tmpPosition : this.props.track.offset;
    }
  
    get track() {
      return this.props.track;
    }
  
    filterData = (_buffer, _samples) => {
      const rawData = _buffer;
      const samples = _samples;
      const blockSize = Math.floor(rawData.length / samples);
      const filteredData = [];
      for (let i = 0; i < samples; i++) {
        filteredData.push(rawData[i * blockSize]); 
      }
      return filteredData;
    }
  
    visualize = (canvas_name) => {
      console.log("Visualize");
      //Пуолчаю холст
      const canvas  = document.getElementById(canvas_name);
      const canvasCtx = canvas.getContext('2d');
  
      //Вычисляю и задаю новую длину холста
      let durationInMs  = this.track.audioBuffer.duration * 1000;
      let lengthInPx = durationInMs * this.props.bpms * this.props.notesInPartCount *  this.props.noteWidth;
      canvas.width = lengthInPx;
  
      //Константы размеров холста
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
  
      //Полдготовка данных
      var dataArrayRaw = this.props.track.audioBuffer.getChannelData(0);    
      let dataArray = this.filterData(dataArrayRaw, dataArrayRaw.length / 256);
      let bufferLength = dataArray.length;
      //TODO: Нормализовать тихие дорожки
  
      var sliceWidth = WIDTH / bufferLength;
      var x = 0;
      var dy = HEIGHT / 2;
      
      //clear
      canvasCtx.beginPath();
      canvasCtx.fillStyle =  "#FF8E00";
      canvasCtx.fillRect(0,0,WIDTH,HEIGHT);
      canvasCtx.stroke();
      //init brush
      canvasCtx.fillStyle = "#ffffff";
      canvasCtx.strokeStyle = "#ffffff";
      // canvasCtx.lineWidth = 3;
      //draw
      let maxVal = 0
      for(var i = 0; i < bufferLength; i = i + 1) {
        var v = dataArray[i];
        var y = dy + v * dy;
  
        if(i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
  
        if (v > maxVal)
          maxVal = v;
      }
      //fill
      canvasCtx.lineTo(WIDTH, dy);
      canvasCtx.stroke();
    }  
  
    render() {
      return <canvas id="audio_canvas_inside" className="user-audio-visualization"  ref={this.canvasRef} width="0" height={this.props.noteHeight} style={{marginLeft: this.offset + "px"}}></canvas>
    }
    
  }