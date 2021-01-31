import React from "react";

class CanvasNotes extends React.PureComponent {
    constructor(props) {
      super(props);
  
      this.canvas = null;
      this.ctx = null;
      this.cWidth = 1000;
      this.cHeight = 800;
      // Начало по X линии
      this.startX = 20;
      // Линии
      this.lineWidth = 2;
      this.linePadding = 10;
      this.linesInGroupCount = 5;      
      this.lineLength = this.cWidth - this.startX*2;
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
  
    draw(tracks, notesLimit, bpm) {
      //console.log('Draw', tracks);
      this.clear();
      this.drawList(tracks, notesLimit, bpm);
    }
    
    clear() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    setCanvasHeight(height) {
      this.canvas.height = height;
    }

    drawList(tracks, notesLimit, bpm) {
      // Вычисляю сколько нужно строк, чтобы уместить все ноты
      this.groupsCount  = Math.ceil(notesLimit / this.notesInLine);
      // Рассчитываю высоту холста
      this.cHeight = (this.groupsCount  + 1) * this.lineGroupHeight;
      // Обновляю высоту холста
      this.setCanvasHeight(this.cHeight);

      // Рисую ифно о BPM
      this.drawBpm(bpm);

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
        
        let notesLength = notesLimit; //tracks[0].notes.length;
        for (let noteIndex = 0; noteIndex < notesLength; noteIndex++) {
          
          // Координаты ноты по X
          let note_x = this.startX + lineNoteCounter * (this.noteRadius * 2 + this.noteRadius) + taktCounter * this.taktPadding;
          // Начало четверти
          let lead4 = (noteIndex) % 4 === 0;
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
              this.drawNote(note_x, _y, track.type, line);
  
              // Запоминаем самую верхнююю линию, на которой лежит нота
              noteLine = line > noteLine ? line : noteLine;
            }
          }
          
          // Нормализую границы
          leftBound = leftBound !== 99 ? leftBound % 4 : leftBound;
          rightBound = rightBound !== -99 ? rightBound % 4 : rightBound ;
  
          // Вычисляю размер        
          if (lead4 && !(pattern[0] === 1 && pattern[1] === 0 && pattern[2] === 1 && pattern[3] === 0) ) {
            pattern16 = true;
          }
          if (lead4 && (pattern[0] === 1 && pattern[1] === 0 && pattern[2] === 0 && pattern[3] === 0)) {
            pattern16 = false;
            pattern4 = true;
          }
  
          //Если размер 16 и нет ноты, то рисую паузу
          if (pattern16 && noteLine === -99 && leftBound !== 99 && rightBound !==-99) {
            let pauseLine = 3;
            let x = note_x;
            let y = lineNumb * this.lineGroupHeight - this.linePadding/2 + pauseLine * this.linePadding
            this.drawPause(x, y);
          }
  
          // Подтягиваю нотные палки вверх        
          if (noteLine !== -99) {  
              // Вертикальная линия
              let x = note_x + this.noteRadius;
              let y = lineNumb * this.lineGroupHeight - this.linePadding/2 + noteLine * this.linePadding;//- this.noteRadius*2;            
              let length = (noteLine - downBound ) * (this.linePadding) + this.noteRadius*6;            
  
              // Если размер 16 и нота не первая и не последняя в группе, то рисую палочку покороче
              let idx16 = noteIndex % 4;
              if (pattern16 && idx16 !== leftBound && idx16 !== rightBound) {
                length  = length - this.noteRadius;
              }
  
              this.drawVerticalLine(x, y, -length);
  
              // Если онты обособлены, то рисую кончик 16 нот
              if (pattern16 && leftBound === rightBound) {
                this.drawNote16Tail(x - this.noteRadius, y - length + this.noteRadius * 2);
              }
          }
  
          // Рисую соеденительную линию
          if (lead4 && leftBound !== 99 && rightBound !== -99) {
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
    drawNote(posX, posY, type, line) {
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

      // Дополнительная линия для верхних ноты
      if (line === 0.5) {
        this.drawHorizontalLine(posX - this.noteRadius * 1.5 , posY, this.noteRadius * 3);
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
  
    // Инфо о BPM
    drawBpm(bpm) {
      let oldFont = this.ctx.font;
      this.ctx.font = "16px Arial";
      this.ctx.textAlign = "center"
      this.ctx.fillText(`BPM = ${bpm}`, this.cWidth / 2, this.groupsPadding);       
      this.ctx.font = oldFont;
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
      return <canvas id="canvas_notes" width={this.cWidth} height={this.cHeight}></canvas>;//<div className="canvas_notes_wrapper" >
        
        //</div>
    }
}

  
export default CanvasNotes;