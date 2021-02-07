import React from "react";

import Toolbar from "./toolbar/toolbar";
import * as PlayerStates from "../../redux/dictionary/playerStates";
import TracksPlayer from "./tracksPlayer/tracksPlayer";
import Timeline from "./timeline/timeline";
import TaktControls from "./taktControls/taktControls";
import ButtonAddTakt from "./buttonAddTakt/buttonAddTakt";
import TrackList from "./trackList/trackList";

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
    this.DrawNotes();
    this.updateTimeControls();
  }

  componentDidUpdate(prevProps) {
    // Если изменился параметр отрисовки, то перерисую ноты
    if (this.props.realtimeRender === true && prevProps.realtimeRender === false) {
      this.DrawNotes();
    }
    
    // Изменилось время начала проигрывания или статус плеера, то перерисую контролы зависящие от времени
    if (this.props.baseTime !== prevProps.baseTime || this.props.playerState !== prevProps.playerState) {
      this.updateTimeControls();
    }
    
    //Auto scroll
    //Получаю координату клика внутри временной шкалы
    if (this.props.tracksLengthInTakts > prevProps.tracksLengthInTakts) {      
      this.scrollTracksConatinerToEnd();
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

  scrollTracksConatinerToEnd = () => {
    console.log("Auto scroll");
    let el = this.tracksContainerRef.current; 
    el.scrollLeft=el.scrollLeft+this.props.noteWidth*this.props.notesInTakt;
  }

  // DRAW NOTES
  DrawNotes() {          
    if (this.props.realtimeRender) {
      this.props.renderNotes();
    }
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
    this.DrawNotes();
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


  handlePlayerStep = () => {
      this.updateTimeControls();
  }

  /*
  * GETTERS
  */

  get timestamp() {
    //console.log('getTimestamp',this.props.getTimestamp);
    if (this.props.playerState === PlayerStates.STOP || this.props.playerState === PlayerStates.PAUSE) {
      return this.props.baseTime
    } else {
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

    return <div className="Editor no-print">
      {/* TODO: pass needed props or connect to redux */}
      <TracksPlayer onStep={this.handlePlayerStep} {...this.props} ref={this.tracksPlayerRef}/>

      <Toolbar timeTextRef={this.timeTextRef}/>

      <div className="track-container" ref={this.tracksContainerRef}>
        {/* TIMELINE */}
        <Timeline onClick={this.handleTimelineClick} timePointerRef={this.timePointerRef} {...this.props}/>        

        {/* TRACKS */}
        <TrackList onNoteClick={this.handleNoteClick} {...this.props}/>

        {/* TAKT CONTROLS */}
        <TaktControls {...this.props}/>

        {/* BUTTON ADD TAKT */}
        <ButtonAddTakt {...this.props}/>
      </div>

    </div>
  }
}