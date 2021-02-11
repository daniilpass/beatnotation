import React from "react";

import AudioSercive from "../../services/AudioService";

import Toolbar from "./toolbar/toolbar";
import * as PlayerStates from "../../redux/dictionary/playerStates";
import TracksPlayer from "./tracksPlayer/tracksPlayer";
import Timeline from "./timeline/timeline";
import TaktControls from "./taktControls/taktControls";
import ButtonAddTakt from "./buttonAddTakt/buttonAddTakt";
import TrackList from "./trackList/trackList";
import BusyIndicator from "../controls/busyIndicator/busyIndicator";

export default class Editor extends React.Component {
  constructor(props){
      super(props);    

      //REFS      
      this.tracksContainerRef = React.createRef();
      this.timePointerRef = React.createRef();
      this.timeTextRef = React.createRef(); 
  }

  //
  // LIFECYCLE
  //

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
    
    // При увеличении длины тактов прокручиваю трэки в конец
    if (this.props.tracksLengthInTakts > prevProps.tracksLengthInTakts) {      
      this.scrollTracksConatinerToEnd();
    }     
  }

  addEvents() {
    // Событие прокрутки трэков
    this.tracksContainerRef.current.addEventListener('wheel', this.handleTracksWheel);
  }

  scrollTracksConatinerToEnd = () => {
    // Прокрутка трэков в конец
    console.log("Auto scroll");
    let el = this.tracksContainerRef.current; 
    el.scrollLeft=el.scrollLeft+this.props.noteWidth*this.props.notesInTakt;
  }

  DrawNotes() { 
    // Отрисовка нот         
    if (this.props.realtimeRender) {
      this.props.renderNotes();
    }
  }
 
  updateTimeControls() {   
    // Ручное обновление частей интерфейса зависимых от таймер 
    window.requestAnimationFrame(() => {
      // Обновление текстового представления времени
      this.timeTextRef.current.innerText = "Time: " + this.getFormattedTime;
      // Обновление позиции курсора
      this.timePointerRef.current.style.left = this.timePointerXPos + "px";

      // Если идет проигрывание и курсор вышел за пределы экрана, то прокручу треки вперед
      if (this.props.playerState === PlayerStates.PLAY) {
        let scrollContainer = this.tracksContainerRef.current;
        let scrollLeft = scrollContainer.scrollLeft;
        let timePointerPosOnScreen = this.timePointerXPos - scrollLeft;
        let clientWidht = document.body.clientWidth;
  
        if (timePointerPosOnScreen > clientWidht){
          scrollContainer.scrollLeft = scrollContainer.scrollLeft + document.body.clientWidth - this.props.trackControlWidth;
        }
      }      
    });    
  }

  //
  // WORKSPACE EVENTS
  //
  handleNoteClick = (trackIndex, taktIndex, noteIndex, level) => {
    //console.log('handleNoteClick', trackIndex, taktIndex, noteIndex)

    //HACK: not use redux state update for performance
    let track = this.props.tracks[trackIndex];
    let takt = track.takts[taktIndex];
    takt.notes[noteIndex] = level;

    // Проигрываю выбранную ноту
    if (level > 0 && this.props.playbackNotes) {
      AudioSercive.playSample(trackIndex, track.volume);
    }

    // Рисую ноты
    this.DrawNotes();
  }

  handleTimelineClick = (e) => {   
    // ОБработка клика по временной шкале 
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
    // Прокрутка трэков колесом
    e.preventDefault();
    this.tracksContainerRef.current.scrollLeft += e.deltaY;;
  }

  handlePlayerStep = () => {
      // При каждом шаге плеера обновляю интерфейс
      this.updateTimeControls();
  }

  //
  // GETTERS
  //

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
      <TracksPlayer onStep={this.handlePlayerStep} {...this.props} />

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

      <BusyIndicator busy={this.props.app.busy} text={this.props.app.text}/>
    </div>
  }
}