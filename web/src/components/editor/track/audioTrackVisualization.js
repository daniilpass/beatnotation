import React from "react";

export default class AudioTrackVisualization extends React.Component {
    constructor(props){
      super(props);
  
      this.state = {
        position: this.props.position || 0
      }
  
      this.drag = {
        oldClientY: -1
      }

      this.canvas = null;
      this.canvasCtx = null;
      this.canvasWrapper = null;

      this.canvasContainer = React.createRef(); 
    }  
  
    componentDidMount() {
      this.canvasWrapper = document.getElementById(this.canvasContainerId);
      this.canvasContainer.current.onmousedown = this.dragMouseDown;
    }
  
    shouldComponentUpdate(nextProps, nextState) {
      if (this.props.loaded !== nextProps.loaded
        || this.props.bpms !== nextProps.bpms 
        || this.props.notesInPartCount !== nextProps.notesInPartCount 
        || this.props.noteWidth !== nextProps.noteWidth
        || this.state.position !== nextState.position
        || this.props.position !== nextProps.position) {
        return true;
      }
      return false;
    }
  
    componentDidUpdate(prevProps) {
      if (this.props.loaded === true && (this.track.arrayBuffer !== prevProps.track.arrayBuffer
        || this.props.bpms !== prevProps.bpms 
        || this.props.notesInPartCount !== prevProps.notesInPartCount 
        || this.props.noteWidth !== prevProps.noteWidth)) {
        this.handleVisualize();
      }

      if (this.props.loaded === false) {
        this.clearVisualization();
      }
      
      if (this.props.position !== prevProps.position) {
        this.setState({position:this.props.position}) 
      }
    }  
  
    get track() {
      return this.props.track;
    }

    get canvasContainerId () {
      return "audio_canvas_container_"+this.props.index;
    }

    get canvasClassName() {
      return "audio_canvas_"+this.props.index;
    }

    //
    // DRAG
    //
    dragMouseDown = (e) => {
      e.preventDefault();
  
      this.drag.oldClientX = e.clientX;
      document.onmouseup = this.closeDragElement;
      document.onmousemove = this.dragCanvas;
    }
  
    closeDragElement = (e) => {
      e.preventDefault();
      document.onmouseup = null;
      document.onmousemove = null;
      this.props.onPositionChanged(this.state.position);
    }
  
    dragCanvas = (e) => {
      e.preventDefault();
  
      let deltaX = (this.drag.oldClientX - e.clientX)
      this.drag.oldClientX = e.clientX;
  
      //change pos
      let newPosition = this.state.position - deltaX;
      if (newPosition >= 0 && (newPosition + this.props.noteWidth) <= this.props.parentWidth) {
        this.setState({position: newPosition})
        //requestAnimationFrame( () => { this.setState({position: newPosition}) } );
      }
    }
    
    //
    // DRAW
    //
    handleVisualize = () => {
        console.log("Visualize");
        this.props.setAppBusy(true, "Processing ...");
        setTimeout(() => {this.visualize()}, 500);
    }  

    clearVisualization = () => {
      console.log("Clear Visualization");
      this.deleteCanvases();
    }


    getCanvasContext = () => {
      let allCanvasElements = document.getElementsByClassName(this.canvasClassName)
      this.canvas = allCanvasElements[allCanvasElements.length - 1];
      this.canvasCtx = this.canvas.getContext('2d');
    }

    addCanvas = () => {
      let newCanvas = document.createElement("canvas");
      newCanvas.width = 0;
      newCanvas.height = this.props.noteHeight;
      newCanvas.className = this.canvasClassName
      this.canvasWrapper.appendChild(newCanvas);
    }

    deleteCanvases = () => {
      // Удаляю старые холсты
      while (this.canvasWrapper.childElementCount > 0) {
        this.canvasWrapper.removeChild(this.canvasWrapper.firstChild);
      }
    }

    visualize = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const actx = new AudioContext();

      actx.decodeAudioData(this.track.arrayBuffer.slice(), 
          audioBuffer => {  
              this.drawFullTrack(audioBuffer);
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

    drawFullTrack = (audioBuffer) => {      
      //Полдготовка данных
      let filterNum = 64;
      let sampleRate  = audioBuffer.sampleRate;
      let dataArrayRaw = audioBuffer.getChannelData(0);
      let dataArray = this.filterData(dataArrayRaw, dataArrayRaw.length / filterNum);

      //Очистка холстов
      this.deleteCanvases();

      // Отрисовка с разделением по холстам
      let samplesInPart = sampleRate / filterNum * 30;
      for (let i = 0; i < dataArray.length; i=i+samplesInPart) {
        // Длина части в пикселях
        let dataChunk = dataArray.slice(i, i+samplesInPart)
        let durationInMs  = ((dataChunk.length * filterNum) / sampleRate) * 1000 ;
        let lengthInPx = durationInMs * this.props.bpms * this.props.notesInPartCount *  this.props.noteWidth;

        // Отрисовка части
        this.addCanvas();
        this.getCanvasContext();
        this.draw(dataChunk, lengthInPx, this.props.noteHeight);        
      }
      
    }

    draw = (dataArray, WIDTH, HEIGHT) => {
        //Пуолчаю холст
        let canvas  = this.canvas
        let canvasCtx = this.canvasCtx;
        canvas.width = WIDTH;
        canvas.height = HEIGHT;

        //Полдготовка данных
        let bufferLength = dataArray.length;
        //TODO: Нормализовать тихие дорожки

        var sliceWidth = WIDTH / bufferLength;
        let x = 0;
        var dy = HEIGHT / 2;

        //clear
        canvasCtx.beginPath();
        canvasCtx.fillStyle =  "#FFA12A";
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

            //dataArrayRaw=null;
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
      return <div id={this.canvasContainerId} className="user-audio-visualization" style={{marginLeft: this.state.position + "px"}} ref={this.canvasContainer}>
          <canvas className={this.canvasClassName} width="0" height={this.props.noteHeight}></canvas>
        </div>
    }
    
  }