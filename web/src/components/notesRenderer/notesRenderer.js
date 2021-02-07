import React from "react";

class NotesRenderer extends React.Component {
    constructor(props) {
      super(props);
  
      this.canvasWrapper = null
      this.canvas = null;
      this.ctx = null;
      this.cWidth = 1000;
      this.cHeight = 0;
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
      this.delimiterHeight = (this.linesInGroupCount - 1) * (this.linePadding);
      this.groupsPerPage = 12;
      // Ноты
      this.noteRadius = 5;
      
      this.notesInGroup = 4;
      this.notesInTakt = 16;
      this.notesInLine = this.notesInTakt * 4;
      this.taktPadding = this.noteRadius * 5;
    }
  
    componentDidMount() { 
      this.canvasWrapper = document.getElementsByClassName('canvas_notes_wrapper')[0];
      //this.draw();      
      this.lastNoteIndex = 0;
    }

    componentDidUpdate(prevProps) {
      if (this.props.renderTime !== prevProps.renderTime) {
        this.drawFromStore();
      }
    }

  
    initCanvasContext() {
      let allCanvasElements = document.getElementsByClassName('canvas_notes')
      this.canvas = allCanvasElements[allCanvasElements.length - 1];
      this.ctx = this.canvas.getContext('2d');
    }

    drawFromStore(){      
      if (!this.props.realtimeRender) {
        return;
      }
      console.log("NotesRenderer: drawFromStore()");
      let maxTaktCount = 0;

      for (let tIdx = 0; tIdx < this.props.tracks.length; tIdx++) {
        const _track = this.props.tracks[tIdx];
        
        for (let taktIdx = 0; taktIdx < _track.takts.length; taktIdx++) {
          const _takt = _track.takts[taktIdx];
          let tmpMaxTaktCount = (taktIdx + 1); // make +1 to convert index to count
          maxTaktCount = (_takt.notes.lastIndexOf(1) >= 0 && tmpMaxTaktCount > maxTaktCount) ?  tmpMaxTaktCount : maxTaktCount; 
        }
      } 

      this.draw(this.props.tracks, maxTaktCount, this.props.bpm, this.props.timeSignature, this.props.notesInTakt);
    }

    draw(tracks, taktCountLimit, bpm, timeSignature, notesInTakt) {
      // console.log('draw', tracks, taktCountLimit, bpm, timeSignature, notesInTakt)
      // Удаляю старые холсты
      while (this.canvasWrapper.childElementCount > 1) {
        this.canvasWrapper.removeChild(this.canvasWrapper.firstChild);
      }

      // Инициализирую контекст для холста
      this.initCanvasContext();

      this.clear();

      this.drawList(tracks, taktCountLimit, bpm, timeSignature, notesInTakt);
    }
    
    clear() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    setCanvasHeight(height) {
      this.canvas.height = height;
    }

    drawList(tracks, taktCountLimit, bpm, timeSignature, notesInTakt) {
      //Размер
      let tsUp =  timeSignature[0];
      let tsDown = timeSignature[1];

      //TODO: look at calculation in Track->Takt Component
      if (tsDown === 8 && (tsUp % 3) === 0) {
        this.notesInGroup = 6;
      } else {
        this.notesInGroup = 4;
      }

      this.notesInTakt = notesInTakt;
     
      //TODO: если длинный такт, то делать разбиение...

      let taktWidthInPx = this.startX + this.notesInTakt * (this.noteRadius * 2.5) + this.taktPadding
      let maxTaktInRow  = Math.trunc(this.cWidth / taktWidthInPx);
      maxTaktInRow = maxTaktInRow < 1 ? 1 : maxTaktInRow;

     // console.log('taktWidthInPx', taktWidthInPx);
     // console.log('maxTaktInRow', maxTaktInRow);

      this.notesInLine = this.notesInTakt * maxTaktInRow;

      //console.log('notesInLine', taktWidthInPx);

      // Вычисляю сколько нужно строк, чтобы уместить все ноты
      this.groupsCount  =  this.groupsPerPage; //Math.ceil(taktCountLimit / this.notesInLine);
      //this.groupsCount  =  this.groupsCount > this.groupsPerPage ? this.groupsPerPage : this.groupsCount;      
      // Рассчитываю высоту холста
      this.cHeight = (this.groupsCount  + 1) * this.lineGroupHeight;
      // Обновляю высоту холста
      this.setCanvasHeight(this.cHeight);

      // Рисую ифно о BPM
      this.drawBpm(bpm + ". Time signature = " + tsUp+"/"+tsDown);

      // Рисую сетку
      for (let i = 1; i <= this.groupsCount; i++) {
        this.drawLineSet(this.startX, this.lineGroupHeight  * i);   
      }
  
      // Рисую ноты
      if (tracks) {
        
  
        let lineNumb = 1;
        let prevLineNumb = 1;

        let lineNoteCounter = 1;
        let taktCounter = 1;
  
        // ГРаницы для соединения нот
        let downBound = Number.MAX_SAFE_INTEGER;
        //let upperBound = Number.MIN_SAFE_INTEGER;
        let leftBound = Number.MAX_SAFE_INTEGER;
        let rightBound = Number.MIN_SAFE_INTEGER;
        let pattern = [0,0,0,0];
        let pattern16 = false;
        let pattern8 = false;
        //let pattern4 = false;        
      
        for (let taktIndex = 0; taktIndex < taktCountLimit; taktIndex++) {

          for (let noteIndex = 0; noteIndex < this.notesInTakt; noteIndex++) {
            // Если линий достаточно, то создаю новый canvas и рисую уже на нем
            if ( (prevLineNumb !== lineNumb) && (lineNumb % this.groupsPerPage === 1) ) {              
              console.log("NEW CANVAS", prevLineNumb, lineNumb, this.groupsPerPage);
              prevLineNumb = 1;
              lineNumb = 1;
              
              // Создавю новый холст
              let newCanvas = document.createElement("canvas");
              newCanvas.width = this.cWidth;
              newCanvas.height = this.cHeight;
              newCanvas.className ="canvas_notes"
              this.canvasWrapper.appendChild(newCanvas);
              this.initCanvasContext();

              // Рисую сетку уже на новом холсте
              for (let i = 1; i <= this.groupsCount; i++) {
                this.drawLineSet(this.startX, this.lineGroupHeight  * i);   
              }
            }

            // Начало четверти
            let leadNote = (noteIndex) % this.notesInGroup === 0;
            // Номер нижней ноты на линииях
            let noteLine = Number.MIN_SAFE_INTEGER;
            // Сбросим границы при новом такте
            if (leadNote) {
              downBound = Number.MAX_SAFE_INTEGER;
              //upperBound = Number.MIN_SAFE_INTEGER;
              leftBound = Number.MAX_SAFE_INTEGER;
              rightBound = Number.MIN_SAFE_INTEGER;
              pattern = new Array(this.notesInGroup);
              for (let i = 0; i < this.notesInGroup; i++) {
                pattern[i] = 0;                
              }
              pattern16 = false;
              //pattern4 = false;
            }

            // Координаты ноты по X
            let note_x = this.startX + lineNoteCounter * (this.noteRadius * 2.5) + taktCounter * this.taktPadding;

            // Проходим по всем треках, рисуем ноты и если начало такта, то вычисляем границы нот в такте
            for (let trackIndex = 0; trackIndex <  tracks.length; trackIndex++) {
              let track = tracks[trackIndex];
              let notes = track.takts[taktIndex].notes;
              let note = notes[noteIndex];
              let line = track.line;
              
              // Вычисление границ и размера такта
              if (leadNote) {
                //reset bounds            
                let _leftBound=Number.MAX_SAFE_INTEGER;
                for (let i = this.notesInGroup - 1; i >= 0; i--) {
                  _leftBound = notes[noteIndex + i] > 0 ? noteIndex + i : _leftBound; 
                }
                leftBound = _leftBound < leftBound ? _leftBound : leftBound;

                let _rightBound=Number.MIN_SAFE_INTEGER;
                for (let i = 0; i < this.notesInGroup; i++) {
                  _rightBound = notes[noteIndex + i] > 0 ? noteIndex + i : _rightBound;
                }                   
                rightBound = _rightBound > rightBound ? _rightBound : rightBound;
    
                let _downBound = Number.MAX_SAFE_INTEGER;
                for (let i = this.notesInGroup - 1; i >= 0; i--) {
                  _downBound = notes[noteIndex + i] > 0 ? track.line : _downBound; 
                }
                downBound = _downBound < downBound? _downBound : downBound;
    
                //detect size
                for (let i = 0; i < this.notesInGroup; i++) {
                  if (notes[noteIndex + i] > 0 ) {
                    pattern[i]=1;
                  }
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
            leftBound = leftBound !== Number.MAX_SAFE_INTEGER ? leftBound % this.notesInGroup : leftBound;
            rightBound = rightBound !== Number.MIN_SAFE_INTEGER ? rightBound % this.notesInGroup : rightBound ;
    
            // Вычисляю размер нот в часте такта        
            if (leadNote) {               
              //Если ноты чередуются, то это 8й иди 16й размер
              if (tsDown === 4) {
                pattern16 = false;  
                pattern8 = false; 
                for (let i = 0; i < this.notesInGroup; i=i+2) {
                  if (!(pattern[i] === 1 && pattern[i+1] === 0)) {
                      pattern16 =  true;               
                  }
                }
                //Hack: четвертная нота
                if ((pattern[0] === 1 && pattern[1] === 0 && pattern[2] === 0 && pattern[3] === 0)) {
                  pattern16 = false;
                }
              }
              
              if (tsDown === 8) {
                pattern16 = false;  
                pattern8 = true; 
                for (let i = 0; i < this.notesInGroup; i=i+2) {
                  if (!(pattern[i] === 1 && pattern[i+1] === 0) && !(pattern[i] === 0 && pattern[i+1] === 0)) {
                      pattern8 = false;                
                  }
                }
                pattern16 = (tsDown === 8 && pattern8 === false) ? true : false;
              }
              //console.log('pattern', pattern, 'pattern16', pattern16, 'pattern8', pattern8);
            }

            /*
            *ПАУЗЫ
            */   
            
            if (tsDown === 4) {
              //Если четверть пустая, то рисую четвернтую паузу
              if (leadNote && (pattern[0] === 0 && pattern[1] === 0 && pattern[2] === 0 && pattern[3] === 0)) {
                let pauseLine = 2;
                let x = note_x + this.noteRadius*4;
                let y = lineNumb * this.lineGroupHeight - this.linePadding/2 + pauseLine * this.linePadding
                this.drawPause4(x,y)  
              }
              //Если размер 16, нет ноты и часть не пустая, то рисую паузу
              if (noteLine === Number.MIN_SAFE_INTEGER && leftBound !== Number.MAX_SAFE_INTEGER && rightBound !==Number.MIN_SAFE_INTEGER) {
                let pauseLine = 3;
                let x = note_x;
                let y = lineNumb * this.lineGroupHeight - this.linePadding/2 + pauseLine * this.linePadding
                //16-е паузы самые маленькие, вставляем на каждую пустую ноту
                if (pattern16) {
                  this.drawPause16(x, y);
                } 
              }
              //TODO: рисовать 8е паузы
            }

            if (tsDown === 8 && this.skipNote !== noteIndex) {
              //Если размеры такта 8, то 4я пауза на каждую 1-ю пустую ноту
              if (pattern8 && noteIndex%2===0 && noteLine === Number.MIN_SAFE_INTEGER ) {              
                let pauseLine = 3;
                let x = note_x;
                let y = lineNumb * this.lineGroupHeight - this.linePadding/2 + pauseLine * this.linePadding
                //Восьмые паузы рисуем только на 8х ноты
                this.drawPause8(x, y);
              } 
              if (pattern16 && noteLine === Number.MIN_SAFE_INTEGER) { 
                //console.log('====>',noteIndex, pattern, noteIndex%this.notesInGroup, noteIndex%this.notesInGroup + 1,leftBound, rightBound)
                if (noteIndex%2===0 
                    && pattern[noteIndex%this.notesInGroup + 1] === 0 
                    && ((noteIndex%this.notesInGroup > rightBound || noteIndex%this.notesInGroup < leftBound)) ) 
                {
                  let pauseLine = 3;
                  let x = note_x;
                  let y = lineNumb * this.lineGroupHeight - this.linePadding/2 + pauseLine * this.linePadding
                  //Восьмые паузы рисуем только на 8х ноты
                  this.drawPause8(x, y);
                  this.skipNote = noteIndex + 1;
                } else {
                  let pauseLine = 3;
                  let x = note_x;
                  let y = lineNumb * this.lineGroupHeight - this.linePadding/2 + pauseLine * this.linePadding
                  //Восьмые паузы рисуем только на 8х ноты
                  this.drawPause16(x, y);
                }  
              }     
            }

            //После пропуска ноты, сбросим значение
            if (this.skipNote === noteIndex) {
              this.skipNote = -1;
            }

                   
    
            /*        
            * Подтягиваю нотные палки вверх 
            */
            if (noteLine !== Number.MIN_SAFE_INTEGER) {  
                // Вертикальная линия
                let x = note_x + this.noteRadius;
                let y = lineNumb * this.lineGroupHeight - this.linePadding/2 + noteLine * this.linePadding;//- this.noteRadius*2;            
                let length = (noteLine - downBound ) * (this.linePadding) + this.noteRadius*6;            
    
                // Если размер 16 и нота не первая и не последняя в группе, то рисую палочку покороче
                let idx16 = noteIndex % this.notesInGroup;
                if (pattern16 && idx16 !== leftBound && idx16 !== rightBound) {
                  length  = length - this.noteRadius;
                }
    
                this.drawVerticalLine(x, y, -length);
    
                // Если ноты обособлены, то рисую кончик нот
                //16
                if (pattern16 && leftBound === rightBound) {
                  this.drawNote16Tail(x - this.noteRadius, y - length + this.noteRadius * 2);
                }
                //8
                if (pattern8 && leftBound === rightBound) {
                  this.drawNote8Tail(x - this.noteRadius, y - length + this.noteRadius * 2);
                }
            }
    
            // Рисую соеденительную линию
            if (leadNote && leftBound !== Number.MAX_SAFE_INTEGER && rightBound !== Number.MIN_SAFE_INTEGER) {
              //console.log(leftBound, rightBound)
              // Соеденительная линия размер 8
              let x = note_x + this.noteRadius + leftBound* this.noteRadius * 2.5;
              let y = lineNumb * this.lineGroupHeight - this.linePadding/2 + downBound * this.linePadding - this.noteRadius*6;
              let length = (rightBound - leftBound) * this.noteRadius * 2.5; 

              this.drawHorizontalLine(x, y, length, 3);
    
              // Дополнительная соеденительная линия для размера 16
              if (pattern16) {
                this.drawHorizontalLine(x, y + this.noteRadius, length, 3);
              }
            }

            // Разделитель тактов
            if (noteIndex + 1 === this.notesInTakt) { 
              let _x = note_x + this.taktPadding/2 + this.noteRadius * 2 - this.noteRadius/2;
              let _y = lineNumb * this.lineGroupHeight + this.linePadding;
              this.drawVerticalLine(_x, _y, this.delimiterHeight);
            }

            // Считаю ноты в линии и такте
            lineNoteCounter = lineNoteCounter + 1;
    
            // Если нот достаточно, то перехожу на новые строчки в листе и сбрасываю линейные счетчики
            if (lineNoteCounter > this.notesInLine){
              taktCounter = 0;
              lineNoteCounter = 1;   
              lineNumb = lineNumb + 1;
            }
          }
          
          taktCounter = taktCounter + 1;

        }
        
      }
    }
  
    // Задачет цвет и толщину
    setCanvasStyle(color, width) {
      this.ctx.fillStyle = color;
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = width;
    }
  
    // Рисует паузу 16ю
    drawPause16(posX, posY) {
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

    // Рисует паузу 8ю
    drawPause8(posX, posY) {
      this.setCanvasStyle("#a1a1a1", 1.1);
      
      let pauseRadius = this.noteRadius / 2;
  
      this.ctx.beginPath();
      this.ctx.arc(posX + pauseRadius, posY, pauseRadius, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.moveTo(posX + pauseRadius*2, posY - pauseRadius*2);
      this.ctx.lineTo(posX + pauseRadius, posY + pauseRadius * 5);    
      this.ctx.stroke();
    }

    // Рисует паузу 4ю
    drawPause4(posX, posY){
      
      let pauseRadius = this.noteRadius / 2;
   
      this.setCanvasStyle("#a1a1a1", 2);
      this.ctx.beginPath();     
      this.ctx.moveTo(posX - pauseRadius, posY);
      this.ctx.lineTo(posX + pauseRadius, posY + pauseRadius * 3);  
      this.ctx.stroke();

      this.setCanvasStyle("#a1a1a1", 5);
      this.ctx.beginPath();
      this.ctx.moveTo(posX + pauseRadius, posY + pauseRadius * 2.5);  
      this.ctx.lineTo(posX - pauseRadius, posY + pauseRadius * 6); 
      this.ctx.stroke();

      this.setCanvasStyle("#a1a1a1", 3);
      this.ctx.beginPath();
      this.ctx.moveTo(posX - pauseRadius, posY + pauseRadius * 6);  
      this.ctx.lineTo(posX + pauseRadius, posY + pauseRadius * 9  ); 
      this.ctx.stroke();

      this.setCanvasStyle("#a1a1a1", 3);
      this.ctx.beginPath();
      this.ctx.moveTo(posX + pauseRadius, posY + pauseRadius * 9);  
      this.ctx.lineTo(posX - pauseRadius*2, posY + pauseRadius * 8); 
      this.ctx.stroke();

      this.setCanvasStyle("#a1a1a1", 3);
      this.ctx.beginPath();
      this.ctx.moveTo(posX - pauseRadius*2, posY + pauseRadius * 8);  
      this.ctx.lineTo(posX - pauseRadius, posY + pauseRadius * 11); 
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
  
    // Рисует кончик для 8х нот
    drawNote8Tail (posX, posY) {
      this.setCanvasStyle("#000000", 1.1);
      this.ctx.beginPath();      
      this.ctx.moveTo(posX + this.noteRadius, posY - this.noteRadius);
      this.ctx.lineTo(posX + this.noteRadius*2, posY);
      this.ctx.stroke();  
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
    drawHorizontalLine(x, y, length, width) {
      this.setCanvasStyle("#000000", width || 1.1);
  
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + length, y);
      this.ctx.stroke();
    }
  
    // Горизонтальная линия
    drawVerticalLine(x, y, length, width) {
      this.setCanvasStyle("#000000", width || 1.1);
  
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x, y + length);
      this.ctx.stroke();
    }
  
    //TODO: split on different canvas for print
    render() {
      console.log('Render NotesRenderer');
      return <div className="canvas_notes_wrapper" style={{...this.props.style, display: this.props.realtimeRender ? "block" : "none" }}>
          <canvas className="canvas_notes" width={this.cWidth} height={this.cHeight}></canvas>
      </div>
      
        
        //</div>
    }
}

  
export default NotesRenderer;