import React from "react";
import './App.css';

import SoundCrash from '../../assets/sounds/crash.mp3';
import SoundRide from '../../assets/sounds/ride.mp3';
import SoundHiHatClosed from '../../assets/sounds/hh_closed.mp3';
import SoundHiHatOpened from '../../assets/sounds/hh_open.mp3';
import SoundSnare from '../../assets/sounds/snare.mp3';
import SoundBass from '../../assets/sounds/bassdrum.mp3';
import SoundTomHi from '../../assets/sounds/tom_hi.mp3';
import SoundTomMid from '../../assets/sounds/tom_mid.mp3';
import SoundTomLow from '../../assets/sounds/tom_low.mp3';


class App extends React.Component {
  constructor(props){
      super(props);

      this.timerId = 0;
      this.stepDelay = 10;
      this.partWidth = 20;
      this.defaultBpm = 120;
      this.notesInPartCount = 4;
      this.workspaceMargin = 20;
      this.tracksLength = 128;
      this.prevNoteIndex = -1;

      // types
      // 1 - cricle
      // 2 - cross
      // 3 - cross with o
      this.tracks = [
        {
          audioUrl: SoundCrash,
          audio: new Audio(SoundCrash),
          notes: [],
          line: 0.5,
          type: 2
        },
        {
          audioUrl: SoundRide,
          audio: new Audio(SoundRide),
          notes: [],
          line: 1.5,
          type: 2
        },
        {
          audioUrl: SoundHiHatClosed, 
          audio: new Audio(SoundHiHatOpened),
          notes: [],
          line: 1,
          type: 2
        },
        {
          audioUrl: SoundHiHatOpened,
          audio: new Audio(SoundHiHatOpened),
          notes: [],
          line: 1,
          type: 3
        },
        {
          audioUrl: SoundSnare,
          audio: new Audio(SoundSnare),
          notes: [],
          line: 3,
          type: 1
        },
        {
          audioUrl: SoundTomHi,
          audio: new Audio(SoundTomHi), // tom 2
          notes: []  ,
          line: 2,
          type: 1  
        },
        {
          audioUrl: SoundTomMid,
          audio: new Audio(SoundTomMid), // tom 2
          notes: []  ,
          line: 2.5,
          type: 1  
        },
        {
          audioUrl: SoundTomLow,
          audio: new Audio(SoundTomLow ), //floor tom
          notes: []  ,
          line: 4,
          type: 1  
        },
        {
          audioUrl: SoundBass,
          audio: new Audio(SoundBass),
          notes: []  ,
          line: 5,
          type: 1  
        },
      ]

      console.log(this.tracks, SoundSnare);

      this.tracks.forEach(track => {
        for (let i = 0; i < this.tracksLength; i++) {
          track.notes[i] = 0;       
        }
      });

      // for test
      console.log(this.tracks[0]);
      this.tracks[0].notes[0] = 1; this.tracks[0].notes[4] = 1; this.tracks[0].notes[8] = 1; this.tracks[0].notes[12] = 1; 
      this.tracks[0].notes[16] = 1; this.tracks[0].notes[20] = 1; this.tracks[0].notes[24] = 1; this.tracks[0].notes[28] = 1; 
      this.tracks[0].notes[32] = 1; this.tracks[0].notes[36] = 1; this.tracks[0].notes[40] = 1; this.tracks[0].notes[44] = 1; 
      this.tracks[0].notes[48] = 1; this.tracks[0].notes[52] = 1; this.tracks[0].notes[56] = 1; this.tracks[0].notes[60] = 1;
      this.tracks[0].notes[64] = 1; this.tracks[0].notes[68] = 1; this.tracks[0].notes[72] = 1; this.tracks[0].notes[76] = 1;
      this.tracks[1].notes[4] = 1; this.tracks[1].notes[12] = 1; this.tracks[1].notes[20] = 1;  this.tracks[1].notes[28] = 1;
      this.tracks[2].notes[0] = 1; this.tracks[2].notes[6] = 1; this.tracks[2].notes[10] = 1;
      this.tracks[2].notes[16] = 1; this.tracks[2].notes[22] = 1; 

      this.state = {
        timestamp: 0,
        bpm: this.defaultBpm,
        bpms: this.defaultBpm / 60 / 1000,
        state: "stop",
        connect: true
      }

      this.canvasRef = React.createRef();
  }
 

  componentDidMount () {
    document.addEventListener("keyup", this.handleKeyDown);
    document.addEventListener('keydown', function (e) {
        if (e.key === ' ') {
            e.preventDefault();
            console.log('PREVENT SPACE');
        }
    }, false)
  }

  componentDidUpdate() {
    this.canvasRef && this.canvasRef.current && this.canvasRef.current.draw(this.tracks, this.state.connect);
  }

  componentWillUnmount () {
    document.removeEventListener("keyup", this.handleKeyDown);
  }

  handleKeyDown= (e) => {
    e.preventDefault();
    // console.log(e);
    switch (e.key.toUpperCase()) {
      case ' ':
        if (this.state.state === "play") {
          this.pause();
        } else if (this.state.state === "stop" || this.state.state === "pause") {
          this.play();
        }
        break;
      case 'S':
        if (this.state.state === "play" || this.state.state === "pause") {
          this.stop();
        } 
      break;
      default:
        break;
    }
    return false;
  }

  play = () => {
    console.log("play");
    this.timerId = setInterval(this.step, this.stepDelay);

    this.setState({
      state: "play"
    })    
  }

  stop = () => {
    console.log("stop");

    clearInterval(this.timerId);

    this.setState({
      timestamp: 0,
      state: "stop"
    })
  }

  pause = () => {
    console.log("pause");

    clearInterval(this.timerId);

    this.setState({
      state: "pause"
    })
  }

  step = () => {
    this.setState((state) =>  { 
      return {
        timestamp: state.timestamp + this.stepDelay
      };
    });

    this.playNotes();
  }

  playNotes = () => {
    let noteIndex = Math.trunc(this.part);

    if (noteIndex === this.prevNoteIndex)
      return;

    //console.log(noteIndex);
    for (let trackIndex = 0; trackIndex < this.tracks.length; trackIndex++) {
      const track = this.tracks[trackIndex];
      if (track.notes[noteIndex] > 0) {
        // console.log('Play note', trackIndex, noteIndex, track.audioUrl); 
        let audio = new Audio(track.audioUrl);
        audio.play();
        // track.audio.stop();    
        // track.audio.play();
      }
    }    

    this.prevNoteIndex = noteIndex;
  }

  get timePointerXPos() {
    // return this.state.timestamp / this.partWidth + 16;
    return this.part * this.partWidth + 16;
  }

  get part() {
    return this.state.timestamp * this.state.bpms * this.notesInPartCount;
  }

  handleBpmInputChange = (event) => {
    // let name = event.target.name;
    let value = event.target.value;

    this.setState({
      bpm: value,
      bpms: value / 60 / 1000,
    })    
  }

  handleBooleanInputChange = (event) => {
    console.log(event.target.checked);
    this.setState({
      [event.target.name]: event.target.checked,
    }) 
  }

  handleNoteClick = (trackIndex, noteIndex, level) => {
    let track = this.tracks[trackIndex];
    track.notes[noteIndex] = level;
    //console.log(trackIndex, noteIndex, level, this.tracks);

    this.canvasRef.current.draw(this.tracks, this.state.connect);
  }

  renderTracks() {

  }

  render () {
    //console.log('Render App');

    return <div className="App">
      <header className="App-header">
        Beat maker
      </header>

      <div className="App-toolbar">
        <button className="toolbar-btn toolbar-btn__play" onClick={this.play} disabled={this.state.state === "play"}>Play</button>
        <button className="toolbar-btn toolbar-btn__stop" onClick={this.stop} disabled={this.state.state === "stop"}>Stop</button>
        <button className="toolbar-btn toolbar-btn__pause" onClick={this.pause} disabled={this.state.state === "pause" || this.state.state === "stop"}>Pause</button>
        <div className="toolbar-time" >
          Time: {this.state.timestamp}
        </div>
        <div className="toolbar-part" >
          Part: {Math.trunc(this.part) + 1 }
        </div>
        <div className="toolbar-bpm" >
          BPM: 
          <input name="bpm" value={this.state.bpm} onChange={this.handleBpmInputChange} type="number"></input>
        </div>
        <div>
          Connect notes: 
          <input name="connect" value={this.state.connect} onChange={this.handleBooleanInputChange} checked={this.state.connect} type="checkbox"></input>
        </div>
      </div>

      <div className="workspace" style={{margin: this.workspaceMargin + 'px'}}> 
        <div className="time-pointer" style={{left: this.timePointerXPos}}> 
          <div className="time-pointer__stick">
          </div>
        </div>

        {
          this.tracks.map((_track,i) => {
            return <RowNotes key={"track_"+i} index={i} noteWidth={this.partWidth} noteClick={this.handleNoteClick} 
                             tracksLength={this.tracksLength} notes={_track.notes}/>
          })
        }

       
      </div>

       <CanvasNotes ref={this.canvasRef} />
    </div>
  }
}

class RowNotes extends React.PureComponent {
  // constructor(props) {
  //   super(props);
    
  // }

  handleNoteClick = (index, level) => {
    this.props.noteClick && this.props.noteClick(this.props.index, index, level);
  }

  renderNotes() {
    let els = []
    
    for (let i = 0; i < this.props.tracksLength; i++) {

      let indexInQuarter = i % 16 + 1;
      let filled = false;
      if ((indexInQuarter >= 5 && indexInQuarter <=8) || indexInQuarter >= 13) {
        filled = true;
      }

      // console.log(i, indexInQuarter, filled);
      const el = <Note key={i} index={i} filled={filled} width={this.props.noteWidth} 
                       onClick={this.handleNoteClick} level={this.props.notes[i] || 0}></Note>;
      els.push(el);
    }

    return els;
  }

  render() {
    console.log('Render RowNotes');

    return <div className="workspace__row" style={this.props.style}>
      {this.renderNotes()}
    </div>
  }
}

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
                style={{width: this.width + 'px', left: this.posX}}
                onClick={this.handleClick}>      
    </div>
  }
}

class CanvasNotes extends React.PureComponent {
  constructor(props) {
    super(props);

    this.canvas = null;
    this.ctx = null;
    // Начало по X линии
    this.startX = 20;
    // Линии
    this.lineLength = 800;
    this.lineWidth = 2;
    this.linePadding = 10;
    this.linesInGroupCount = 5;
    // Группы линий
    this.groupsCount = 5;
    this.groupsPadding = 40;
    // Высота группы линий
    this.lineGroupHeight = this.linesInGroupCount * (this.lineWidth  + this.linePadding) + this.groupsPadding;
    this.delimiterHeight = (this.linesInGroupCount + 1) * (this.lineWidth  + this.linePadding);
    // Ноты
    this.noteRadius = 5;
    
    this.notesInTakt = 16;
    this.notesInLine = this.notesInTakt * 3;
    this.taktPadding = this.noteRadius * 10;
  }

  componentDidMount() {
    this.canvas = document.getElementById('canvas_notes');
    this.ctx = this.canvas.getContext('2d');

    // this.drawHorizontalLine(10, 10, 400);
    // this.drawLineSet(this.startX);
    this.draw();
    
    this.lastNoteIndex = 0;
  }

  draw(tracks, connect) {
    //console.log('Draw', tracks);
    this.clear();
    this.drawList(tracks, connect);
  }
  
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  drawList(tracks, connect) {
    // Рисую сетку
    for (let i = 1; i <= this.groupsCount; i++) {
      this.drawLineSet(this.startX, this.lineGroupHeight  * i);   
    }

    // Рисую ноты
    if (tracks) {
      

      let lineNumb = 1;
      let lineNoteCounter = 1;
      let taktNoteCounter = 1;
      let taktCounter = 1;


      // ГРаницы для соединения нот
      let downBound = 999;
      //let upperBound = -999;
      let leftBound = 99;
      let rightBound = -99;
      let pattern = [0,0,0,0];
      let pattern16 = false;
      let pattern4 = false;
      
      let notesLength = tracks[0].notes.length;
      for (let noteIndex = 0; noteIndex < notesLength; noteIndex++) {
        
        // Координаты ноты по X
        let note_x = this.startX + lineNoteCounter * (this.noteRadius * 2 + this.noteRadius) + taktCounter * this.taktPadding;
        // Начало четверти
        let lead4 = (noteIndex) % 4 == 0;
        // Номер нижней ноты на линииях
        let noteLine = -99;
        // Сбросим границы при новом такте
        if (lead4) {
          downBound = 999;
          //upperBound = -999;
          leftBound = 99;
          rightBound = -99;
          pattern = [0,0,0,0];
          pattern16 = false;
          pattern4 = false;
        }

        

        // Проходим по всем треках, рисуем ноты и если начало такта, то вычисляем границы нот в такте
        for (let trackIndex = 0; trackIndex <  tracks.length; trackIndex++) {
          let track = tracks[trackIndex];
          let note = track.notes[noteIndex];
          let line = track.line;
          
          // Вычисление границ и размера такта
          if (lead4) {
            //reset bounds            
            let _leftBound=99;
            _leftBound = track.notes[noteIndex + 3] > 0 ? noteIndex + 3 : _leftBound; 
            _leftBound = track.notes[noteIndex + 2] > 0 ? noteIndex + 2 : _leftBound;
            _leftBound = track.notes[noteIndex + 1] > 0 ? noteIndex + 1 : _leftBound;
            _leftBound = track.notes[noteIndex] > 0 ? noteIndex : _leftBound;

            let _rightBound=-99;
            _rightBound = track.notes[noteIndex] > 0 ? _rightBound : _rightBound; 
            _rightBound = track.notes[noteIndex + 1] > 0 ? noteIndex + 1 : _rightBound;
            _rightBound = track.notes[noteIndex + 2] > 0 ? noteIndex + 2 : _rightBound;
            _rightBound = track.notes[noteIndex + 3] > 0 ? noteIndex +3 : _rightBound;

            leftBound = _leftBound < leftBound ? _leftBound : leftBound;
            rightBound = _rightBound > rightBound ? _rightBound : rightBound;

            let _downBound = 999;
            _downBound = track.notes[noteIndex + 3] > 0 ? track.line : _downBound; 
            _downBound = track.notes[noteIndex + 2] > 0 ? track.line : _downBound;
            _downBound = track.notes[noteIndex + 1] > 0 ? track.line : _downBound;
            _downBound = track.notes[noteIndex] > 0     ? track.line : _downBound;
            downBound = _downBound < downBound? _downBound : downBound;

            //detect size
            if (track.notes[noteIndex] > 0 ) {
              pattern[0]=1;
            }
            if (track.notes[noteIndex+1] > 0 ) {
              pattern[1]=1;
            }
            if (track.notes[noteIndex+2] > 0 ) {
              pattern[2]=1;
            }
            if (track.notes[noteIndex+3] > 0 ) {
              pattern[3]=1;
            }
          }

          // Если нота звучит, то рисуем её
          if (note > 0) {
            let _y = lineNumb * this.lineGroupHeight - this.linePadding/2 + line * this.linePadding
            this.drawNote(note_x, _y, track.type);

            // Запоминаем самую верхнююю линию, на которой лежит нота
            noteLine = line > noteLine ? line : noteLine;
          }
        }
        
        // Нормализую границы
        leftBound = leftBound != 99 ? leftBound % 4 : leftBound;
        rightBound = rightBound != -99 ? rightBound % 4 : rightBound ;

        // Вычисляю размер        
        if (lead4 && !(pattern[0] === 1 && pattern[1] === 0 && pattern[2] === 1 && pattern[3] === 0) ) {
          pattern16 = true;
        }
        if (lead4 && (pattern[0] === 1 && pattern[1] === 0 && pattern[2] === 0 && pattern[3] === 0)) {
          pattern16 = false;
          pattern4 = true;
        }

        //Если размер 16 и нет ноты, то рисую паузу
        if (pattern16 && noteLine == -99 && leftBound != 99 && rightBound !=-99) {
          let pauseLine = 3;
          let x = note_x;
          let y = lineNumb * this.lineGroupHeight - this.linePadding/2 + pauseLine * this.linePadding
          this.drawPause(x, y);
        }

        // Подтягиваю нотные палки вверх        
        if (noteLine != -99) {  
            // Вертикальная линия
            let x = note_x + this.noteRadius;
            let y = lineNumb * this.lineGroupHeight - this.linePadding/2 + noteLine * this.linePadding;//- this.noteRadius*2;            
            let length = (noteLine - downBound ) * (this.linePadding) + this.noteRadius*6;
            this.drawVerticalLine(x, y, -length);

            // Если размер 16 и нота не первая и не последняя в группе, то рисую палочку покороче
            let idx16 = noteIndex % 4;
            if (pattern16 && idx16 != leftBound && idx16 != rightBound) {
              length  = length - this.noteRadius;
            }

            // Если онты обособлены, то рисую кончик 16 нот
            if (pattern16 && leftBound == rightBound) {
              this.drawNote16Tail(x - this.noteRadius, y - length + this.noteRadius * 2);
            }
        }

        // Рисую соеденительную линию
        if (lead4 && leftBound != 99 && rightBound != -99) {
          // Соеденительная линия размер 8
          let x = note_x + this.noteRadius + leftBound* this.noteRadius * 3;
          let y = lineNumb * this.lineGroupHeight - this.linePadding/2 + downBound * this.linePadding - this.noteRadius*6;
          let length = (rightBound - leftBound) * this.noteRadius * 3; 
          this.drawHorizontalLine(x, y, length);

          // Дополнительная соеденительная линия для размера 16
          if (pattern16) {
            this.drawHorizontalLine(x, y + this.noteRadius, length);
          }
        }

        // Разделитель тактов
        if (taktNoteCounter === this.notesInTakt) { 
          let _x = note_x + this.taktPadding/2 + this.noteRadius * 2 - this.noteRadius/2;
          let _y = lineNumb * this.lineGroupHeight - this.linePadding/2;
          this.drawVerticalLine(_x, _y, this.delimiterHeight);
        }

        // Считаю ноты в линии и такте
        lineNoteCounter = lineNoteCounter + 1;
        taktNoteCounter = taktNoteCounter + 1;

        // Если нот достаточно, то перехожу на новые строчки в листе и сбрасываю линейные счетчики
        if (lineNoteCounter > this.notesInLine){
          lineNoteCounter = 1;
          taktCounter = 1;
          taktNoteCounter = 1;  
          lineNumb = lineNumb + 1;
        }

        // Если такт полный, то увеличиваю счетчики такта и сбрасываю  счетчик нот в такте
        if (taktNoteCounter > this.notesInTakt) {   
          taktCounter = taktCounter + 1;
          taktNoteCounter = 1;
        }

        // Для дебага рисую меньше нот
        //if (lineNoteCounter > 4)        return;
      }
      
    }
  }

  // Задачет цвет и толщину
  setCanvasStyle(color, width) {
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
  }

  // Рисует паузу
  drawPause(posX, posY) {
    this.setCanvasStyle("#a1a1a1", 1.1);
    
    let pauseRadius = this.noteRadius / 2;

    this.ctx.beginPath();
    this.ctx.arc(posX + pauseRadius, posY, pauseRadius, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.arc(posX, posY + pauseRadius * 5, pauseRadius, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.moveTo(posX + pauseRadius*2, posY - pauseRadius*2);
    this.ctx.lineTo(posX + pauseRadius, posY + pauseRadius * 10);    
    this.ctx.stroke();
  }

  // Рисует ноту
  drawNote(posX, posY, type) {
    this.setCanvasStyle("#000000", 1.1);

    if (type === 2 || type === 3) {
      // X-type notes
      this.ctx.beginPath();
      this.ctx.moveTo(posX - this.noteRadius, posY - this.noteRadius);
      this.ctx.lineTo(posX + this.noteRadius, posY + this.noteRadius);
      this.ctx.stroke();
      this.ctx.moveTo(posX + this.noteRadius, posY - this.noteRadius);
      this.ctx.lineTo(posX - this.noteRadius, posY + this.noteRadius);
      this.ctx.stroke();
    } else {
      //  Default note
      this.ctx.beginPath();
      this.ctx.arc(posX, posY, this.noteRadius, 0, 2 * Math.PI);
      this.ctx.fill();
    }
    
    this.drawNoteTail(posX, posY, type);
  }

  // Рисует кончик для 16х нот
  drawNote16Tail (posX, posY) {
    this.setCanvasStyle("#000000", 1.1);
    this.ctx.beginPath();      
    this.ctx.moveTo(posX + this.noteRadius, posY - this.noteRadius);
    this.ctx.lineTo(posX + this.noteRadius*2, posY);
    this.ctx.moveTo(posX + this.noteRadius, posY - this.noteRadius * 2);
    this.ctx.lineTo(posX + this.noteRadius*2, posY- this.noteRadius);
    this.ctx.stroke();

  }

  // рисует особые кончики
  drawNoteTail(posX, posY, type) {
    this.setCanvasStyle("#000000", 1.1);

     // Кружок для открытого Hi-Hat's
     if (type === 3) {
      // Draw o
      this.ctx.beginPath();
      this.ctx.arc(posX, posY - this.noteRadius*4, this.noteRadius/2, 0, 2 * Math.PI);
      this.ctx.stroke();
    } 
  }

  // Разделитель тактов
  // drawTaktDelimiter(x, y, length) {
  //   this.setCanvasStyle("#000000", 1.1);

  //   this.ctx.beginPath();
  //   this.ctx.moveTo(x, y);
  //   this.ctx.lineTo(x, length);
  //   this.ctx.stroke();
  // }

  // Рисует группу линий
  drawLineSet(startX, startY) {
    for (let i = 1; i <= this.linesInGroupCount ; i++) {
      this.drawHorizontalLine(startX, startY + i * this.linePadding, this.lineLength);    
    }
  }

  // Вертикальная линия
  drawHorizontalLine(x, y, length) {
    this.setCanvasStyle("#000000", 1.1);

    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + length, y);
    this.ctx.stroke();
  }

  // Горизонтальная линия
  drawVerticalLine(x, y, length) {
    this.setCanvasStyle("#000000", 1.1);

    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x, y + length);
    this.ctx.stroke();
  }

  render() {
    return <canvas id="canvas_notes" width="800" height="850"></canvas>
  }
}

export default App;
