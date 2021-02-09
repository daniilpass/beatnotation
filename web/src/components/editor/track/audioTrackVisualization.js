import React from "react";

export default class AudioTrackVisualization extends React.Component {
    constructor(props){
      super(props);
  
      this.state = {
        tmpPosition: -1
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
        this.handleVisualize("audio_canvas_inside");
      } else if (this.props.loaded === true 
        && (this.props.bpms !== prevProps.bpms || this.props.notesInPartCount !== prevProps.notesInPartCount || this.props.noteWidth !== prevProps.noteWidth)) {
        this.handleVisualize("audio_canvas_inside");
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

    
  
    handleVisualize = (canvas_name) => {
        console.log("Visualize");
        this.props.setAppBusy(true, "Processing ...");
        setTimeout(() => {this.visualize(canvas_name)}, 500);
    }  


    visualize = (canvas_name) => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const actx = new AudioContext();

      actx.decodeAudioData(this.track.arrayBuffer.slice(), 
          audioBuffer => {  
              this.draw(canvas_name, audioBuffer);
          }, 
          error => { console.log("decodeAudioData failed", error); }
      );
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

    draw = (canvas_name, audioBuffer) => {
        //Пуолчаю холст
        const canvas  = document.getElementById(canvas_name);
        const canvasCtx = canvas.getContext('2d');

        //Вычисляю и задаю новую длину холста
        let durationInMs  = audioBuffer.duration * 1000;
        let lengthInPx = durationInMs * this.props.bpms * this.props.notesInPartCount *  this.props.noteWidth;
        canvas.width = lengthInPx;

        //Константы размеров холста
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        // //TEST
        // canvasCtx.beginPath();
        // canvasCtx.fillStyle =  "#FF8E00";
        // canvasCtx.fillRect(0,0,WIDTH,HEIGHT);
        // canvasCtx.stroke();
        // return;

        //Полдготовка данных
        let dataArrayRaw = audioBuffer.getChannelData(0);
        let dataArray = this.filterData(dataArrayRaw, dataArrayRaw.length / 64);
        let bufferLength = dataArray.length;
        //TODO: Нормализовать тихие дорожки

        var sliceWidth = WIDTH / bufferLength;
        let x = 0;
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
        this.drawByChunks(16000, 0, x, dy, bufferLength, dataArray, canvasCtx, sliceWidth,
          () => {
            canvasCtx.lineTo(WIDTH, dy);
            canvasCtx.stroke();

            dataArrayRaw=null;
            dataArray=null;
            this.props.setAppBusy(false);
          }
        );

        
    }
  

    drawByChunks(maxStepInFrame, currentIndex, x, dy, bufferLength, dataArray, canvasCtx, sliceWidth, callback) {
      let chunkCounter = 0;

      for(let i = currentIndex; i < bufferLength; i = i + 1) {
        var v = dataArray[i];
        var y = dy + v * dy;

        if(i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;

        chunkCounter++;

        if (chunkCounter > maxStepInFrame) {
          let progress = Math.trunc((i/bufferLength) * 100);
          this.props.setAppBusy(true, "Processing "+progress+"%");
          window.requestAnimationFrame(() => {
            this.drawByChunks(maxStepInFrame, i, x, dy, bufferLength, dataArray, canvasCtx, sliceWidth, callback)
          });
          return;
        }
      }
      //Final stroke
      canvasCtx.stroke();

      //callback
      callback();
    }

    render() {
      console.log("Render AudioTrackVisualization");
      return <canvas id="audio_canvas_inside" className="user-audio-visualization"  ref={this.canvasRef} width="1" height={this.props.noteHeight} style={{marginLeft: (this.state.tmpPosition > -1 ? this.state.tmpPosition : this.props.track.offset) + "px"}}></canvas>
    }
    
  }