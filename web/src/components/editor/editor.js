import React from "react";

import Toolbar from "./toolbar/toolbar";
import Track from "./track/track";
import * as PlayerStates from "../../redux/dictionary/playerStates";
import TracksPlayer from "./tracksPlayer/tracksPlayer";

const requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;

export default class Editor extends React.Component {
  constructor(props){
      super(props);    

      //REFS      
      this.tracksContainerRef = React.createRef();
      this.timePointerRef = React.createRef();
      this.timeTextRef = React.createRef(); 
      this.tracksPlayerRef = React.createRef();  
  }

  /*
  * LIFECYCLE
  */

  componentDidMount () {
    this.addEvents();
    this.tryDrawNotes();
    this.updateTimeControls();
  }

  componentDidUpdate(prevProps) {
    // Если изменился параметр отрисовки, то перерисую ноты
    if (this.props.realtimeRender === true && prevProps.realtimeRender === false) {
      this.tryDrawNotes();
    }
    
    // Изменилось время начала проигрывания или статус плеера, то перерисую контролы зависящие от времени
    if (this.props.baseTime !== prevProps.baseTime || this.props.playerState !== prevProps.playerState) {
      this.updateTimeControls();
    }
    
    //Auto scroll
    //Получаю координату клика внутри временной шкалы
    if (this.props.tracksLengthInTakts > prevProps.tracksLengthInTakts) {      
      this.scrollTracksConatiner();
    }     
  }

  addEvents() {
    document.addEventListener("keyup", this.handleKeyDown);
    document.addEventListener('keydown', function (e) {
        if (e.keyCode === 32 || e.code === "Space") {
            e.preventDefault();
        }
    }, false)
    this.tracksContainerRef.current.addEventListener('wheel', this.handleTracksWheel);
  }

  scrollTracksConatiner = () => {
    console.log("Auto scroll");
    let el = this.tracksContainerRef.current; 
    el.scrollLeft=el.scrollLeft+this.props.noteWidth*this.props.notesInTakt;
  }

  // DRAW NOTES
  tryDrawNotes(force) {
    if (!this.props.realtimeRender && !force) {
      return;
    }

    //console.log('tryDrawNotes');
    let maxTaktCount = 0;

    for (let tIdx = 0; tIdx < this.props.tracks.length; tIdx++) {
      const _track = this.props.tracks[tIdx];
      
      for (let taktIdx = 0; taktIdx < _track.takts.length; taktIdx++) {
        const _takt = _track.takts[taktIdx];
        let tmpMaxTaktCount = (taktIdx + 1); // make +1 to convert index to count
        maxTaktCount = (_takt.notes.lastIndexOf(1) >= 0 && tmpMaxTaktCount > maxTaktCount) ?  tmpMaxTaktCount : maxTaktCount; 
      }
    } 

    this.props.onRenderNotes && this.props.onRenderNotes(this.props.tracks, maxTaktCount, this.props.bpm, this.props.timeSignature, this.props.notesInTakt);
  }
 
  updateTimeControls() {    
    requestAnimationFrame(() => {
      this.timeTextRef.current.innerText = "Time: " + this.getFormattedTime;
      this.timePointerRef.current.style.left = this.timePointerXPos + "px";
    });    
  }

  /*
  * WORKSPACE EVENTS
  */
  handleNoteClick = (trackIndex, taktIndex, noteIndex, level) => {
    //console.log('handleNoteClick', trackIndex, taktIndex, noteIndex)

    //HACK: not use redux state update for performance, note update state itself
    let track = this.props.tracks[trackIndex];
    let takt = track.takts[taktIndex];
    takt.notes[noteIndex] = level;
    //track.ts = Date.now();

    // Проигрываю выбранную ноту
    if (level > 0 && this.props.playbackNotes) {
      this.tracksPlayerRef.current.playTrackSound(trackIndex);
    }

    // Рисую ноты
    this.tryDrawNotes();
  }

  handleTrackVolumeChange = (trackIndex, value) => {
    console.log("handleTrackVolumeChange", trackIndex, value);
    this.props.setTrackVolume(trackIndex, value);
  }

  handleTimelineClick = (e) => {   
    console.log('handleTimelineClick'); 
    e.preventDefault();
    //Получаю координату клика внутри временной шкалы
    let parentContainer = e.currentTarget.parentNode;
    let targetX = e.pageX - e.currentTarget.offsetLeft + parentContainer.scrollLeft;

    // Вычисляю положение относительно нот
    let notePosition = targetX / this.props.noteWidth;
    let newTimestamp = Math.trunc(notePosition / this.props.bpms / this.props.notesInPartCount);
    
    //TODO: обходное решение
    // Говорю, что мы не вконце
    this.props.setEndOfTrack(false);

    // Обновляю время
    this.props.setBaseTime(newTimestamp, Date.now());    
  }

  handleTracksWheel = (e) => {
    e.preventDefault();
    this.tracksContainerRef.current.scrollLeft += e.deltaY;;
  }


  /*
  TAKT ACTIONs
  */
  handleAddTakt = (e) => {
    console.log('Add takt');
    this.props.taktAdd();
  }

  handleDeleteClick = (taktIndex) => {
    console.log('Delete', taktIndex);
    this.props.taktDelete(taktIndex)  
  }

  handleClearClick = (taktIndex) => {
    console.log('Clear', taktIndex);
    this.props.taktClear(taktIndex)    
  }

  handleCopyClick = (taktIndex) => {
    console.log('Copy', taktIndex);
    this.props.taktCopy(taktIndex)
  }

  handlePasteClick = (taktIndex) => {
    console.log('Paste', taktIndex, this.props.clipboard);

    if (this.props.clipboard.length === 0) {
      console.log('Empty clipboard');
      return;
    }

    this.props.taktPaste(taktIndex);
  }


  handlePlayerStep = () => {
      this.updateTimeControls();
  }

  /*
  * GETTERS
  */
  get timePointerHeight() {
    return this.props.tracks.length * this.props.noteHeight + this.props.timePointerWidth;
  }

  get timestamp() {
    //console.log('getTimestamp',this.props.getTimestamp);
    if (this.props.playerState === PlayerStates.STOP || this.props.playerState === PlayerStates.PAUSE) {
      return this.props.baseTime
    } else if (this.props.playerState === PlayerStates.PLAY) {
      return this.props.baseTime + (Date.now() - this.props.playerStartedAt);
    }    
  }

  get timelineNote() {
    return this.timestamp * this.props.bpms * this.props.notesInPartCount;
  }

  get timePointerXPos() {
    return this.timelineNote * this.props.noteWidth - this.props.timePointerWidth/2 + 2 + this.props.trackControlWidth;
  }

  get getFormattedTime() {
    let ms = this.timestamp % 1000;
    let sec = Math.trunc(this.timestamp / 1000) % 60;
    let min = Math.trunc(this.timestamp / 1000 / 60)
    return (min+'').padStart(2,"0") + ":" +(sec+'').padStart(2,"0") + "." + (ms+'').padStart(3,"0")
  }


  render () {
    console.log('Render Editor');

    return <div className="Editor">
      {/* TODO: pass needed props or connect to redux */}
      <TracksPlayer onStep={this.handlePlayerStep} {...this.props} ref={this.tracksPlayerRef}/>

      <div className="workspace no-print"> 
        <Toolbar timeTextRef={this.timeTextRef}/>

        <div className="track-container" ref={this.tracksContainerRef}>
          {/* TIMELINE */}
          <div className="timeline" style={{width:this.props.noteWidth * this.props.tracksLengthInNotes + "px", marginLeft: this.props.trackControlWidth+"px"}} onClick={this.handleTimelineClick}>
            {
               [...Array(Math.ceil(this.props.tracksLengthInNotes / this.props.notesInTakt))].map((i,k) => {
                return <div key={k} className="timeline__takt" style={{width: this.props.notesInTakt * this.props.noteWidth}}>
                    <div className="takt__number">{k+1}</div>
                  </div>
              })
            }
          </div>
          {/* TIME POINTER */}
          <div className="time-pointer" ref={this.timePointerRef}> 
            <div className="time-pointer__stick" style={{height: this.timePointerHeight+"px"}}>
            </div>
          </div>

          {/* TRACKS */}
          {
            this.props.tracks.map((_track,i) => {
              return <Track key={"track_"+i} index={i} noteWidth={this.props.noteWidth} noteHeight={this.props.noteHeight} noteClick={this.handleNoteClick} 
                              tracksLengthInNotes={this.props.tracksLengthInNotes} tracksLengthInTakts={this.props.tracksLengthInTakts} 
                              timeSignature={this.props.timeSignature}
                              track={_track} ts={_track.ts} 
                              trackControlWidth={this.props.trackControlWidth} addTaktButtonWidth={this.props.addTaktButtonWidth}
                              onVolumeChange={this.handleTrackVolumeChange}
                              />
            })
          }

          {/* TAKT CONTROLS */}
          <div className="takt-controls" style={{width:this.props.noteWidth * this.props.tracksLengthInNotes + "px", marginLeft: this.props.trackControlWidth+"px"}}>
            {
               [...Array(Math.ceil(this.props.tracksLengthInTakts))].map((i,k) => {
                return <div key={k} className="takt-control" style={{width: this.props.notesInTakt * this.props.noteWidth}}>
                    <button className="takt-control__button button" onClick={this.handlePasteClick.bind(this, k)}>Paste</button>
                    <button className="takt-control__button button" onClick={this.handleCopyClick.bind(this, k)}>Copy</button>
                    <button className="takt-control__button button" onClick={this.handleClearClick.bind(this, k)}>Clear</button>
                    <button className="takt-control__button button" onClick={this.handleDeleteClick.bind(this, k)}>Delete</button>
                    <div style={{clear: "both"}}></div>
                  </div>
              })
            }
          </div>

          {/* BUTTON ADD TAKT */}
          <div className="takt-add" style={{width:this.props.addTaktButtonWidth, height: this.props.tracks.length * this.props.noteHeight + this.props.taktControlHeight + "px", marginTop: -this.props.tracks.length * this.props.noteHeight - this.props.taktControlHeight + "px"}}
                onClick={this.handleAddTakt}> 
                <div className="takt-add__content">+</div>           
          </div>

        </div>
        
       
      </div>
    </div>
  }
}