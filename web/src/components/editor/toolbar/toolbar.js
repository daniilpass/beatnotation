import React from "react";
import {connect} from "react-redux";

import {setPlayerState, setRealtimeRender, setPlaybackNotes, setBpm, setTimeSignature, loadTracks, 
    renderNotes, printNotes, loadUserAudio, exportAsWav, setAppBusy,
    setLoop, setGoToStartAfterStop} from "../../../redux/actions";
import {CanPlay, CanStop, CanPause, CanSave, CanLoad, CanPrint, CanExport} from "../../../redux/selectors";
import * as PlayerStates from "../../../redux/dictionary/playerStates";

import { saveFile } from "../../../utils/fileSaver";
import SaveService from "../../../services/SaveService";

import UserFileReader from "../../userFileReader/userFileReader";
import {Select, Option} from "../../controls/select/select";
import SwitchButton from "../../controls/switchButton/switchButton";
import {ReactComponent as LoopIcon} from "../../../assets/img/loop.svg";
import {ReactComponent as NoteIcon} from "../../../assets/img/note8.svg";
import {ReactComponent as PlayNoteIcon} from "../../../assets/img/playback_note.svg";
import {ReactComponent as PlayIcon} from "../../../assets/img/play.svg";
import {ReactComponent as PauseIcon} from "../../../assets/img/pause.svg";
import {ReactComponent as StopIcon} from "../../../assets/img/stop.svg";
import {ReactComponent as OpenIcon} from "../../../assets/img/open-file.svg";
import {ReactComponent as SaveIcon} from "../../../assets/img/save.svg";
import {ReactComponent as PrintIcon} from "../../../assets/img/printing.svg";
import {ReactComponent as RewindIcon} from "../../../assets/img/rewind.svg";

import "./toolbar.css";
import IconButton from "../../controls/iconButton/iconButton";

class Toolbar extends React.Component {
    constructor(props) {
      super(props)

      this.state = {
        bpmDisplayValue: -1
      }
      this.bpmChangeTimerId = 0;
      this.fileReaderRef = React.createRef();  
    }
    
    componentDidMount () {
        // События дли отслеживания горячих клавиш -- Добавление
        document.addEventListener("keydown", this.handleKeyDown);
    }

    componentWillUnmount () {
        // События дли отслеживания горячих клавиш -- Удаление
        document.removeEventListener("keydown", this.handleKeyDown);
    }

    shouldComponentUpdate (nextProps, nextState) {
        if (this.props.timeSignature !== nextProps.timeSignature
            || this.props.bpm !== nextProps.bpm
            || this.state.bpmDisplayValue !== nextState.bpmDisplayValue
            || this.props.canPlay !== nextProps.canPlay
            || this.props.canStop !== nextProps.canStop
            || this.props.canPause !== nextProps.canPause
            || this.props.canSave !== nextProps.canSave
            || this.props.canLoad !== nextProps.canLoad
            || this.props.canPrint !== nextProps.canPrint
            || this.props.canExport!== nextProps.canExport
            || this.props.realtimeRender !== nextProps.realtimeRender
            || this.props.playbackNotes !== nextProps.playbackNotes
            || this.props.loop !== nextProps.loop
            || this.props.goToStartAfterStop !== nextProps.goToStartAfterStop
            ) {
            return true;
        }
        
        return false;
    }

    componentDidUpdate (prevProps, prevState) {
        if (this.props.bpm !== prevProps.bpm) {
            this.setState({ bpmDisplayValue: this.props.bpm });
        }
    }

    get getBpmDisplayValue() {
        return this.state.bpmDisplayValue > -1 ? this.state.bpmDisplayValue : this.props.bpm;
    }

    get timeSignatureString() {
        return this.props.timeSignature[0]+"/"+this.props.timeSignature[1];
    }

    handleKeyDown= (e) => {
        let defaultAction = false;
        switch (e.keyCode) {
          // Space
          case 32:
            if (this.props.canPlay) {
              this.handlePlay();
            } else if (this.props.canPause) {
              this.handlePause();
            }
            break;
          // S
          case 83:
            if (this.props.canStop) {
              this.handleStop();
            } 
          break;
          default:
            defaultAction = true;
            break;
        }

        if (!defaultAction) {
            e.preventDefault();
        }
      }

    /*
    * TOOLBAR ACTIONS
    */

    handlePlay = () => {
        console.log("play");

        this.props.setPlayerState(PlayerStates.PLAY);
        this.props.onPlay && this.props.onPlay();   
    }

    handleStop = () => {
        console.log("stop");

        this.props.setPlayerState(PlayerStates.STOP);
        this.props.onStop && this.props.onStop();
    }

    handlePause = () => {
        console.log("pause");

        this.props.setPlayerState(PlayerStates.PAUSE);
        this.props.onPause&& this.props.onPause();
    }

    handleSave = () => {
        console.log("save");

        this.props.setAppBusy(true, "Processing ...");
        setTimeout(() => {
            let saveData = {
                appVersion: this.props.appVersion,
                bpm: this.props.bpm,
                timeSignature: this.props.timeSignature,
                loop: this.props.loop,
                loopStart:this.props.loopStart,
                loopEnd: this.props.loopEnd,  
                realtimeRender: this.props.realtimeRender,
                playbackNotes: this.props.playbackNotes,
                tracks: [...this.props.tracks],     
            }
    
            let blobSave = SaveService.createSaveFile(saveData);
            const file = new Blob([blobSave], {type: 'application/octet-stream'});
            
            saveFile(file, "BeatNotation_"+Date.now()+".beno");
    
            this.props.setAppBusy(false);
        }, 0)
        
    }

    handleLoad = () => {
        console.log("load");
        this.fileReaderRef.current.selectFile();
    }

    handleFileLoaded = (arrayBuffer) => {
        let asyncLoading = false;
        this.props.setAppBusy(true, "Processing ...");

        setTimeout(() => {
            var data = SaveService.readSaveFile(arrayBuffer);
            this.props.loadTracks(data);
            this.props.renderNotes();
    
            //load user audio files  
            //TODO: использовать асинхронно, когда появится поддержка нескольких дорожек      
            data.tracks.forEach((track, trackIndex) => {
                if (track.type === 0 && track.arrayBuffer && track.arrayBuffer.length > 0) {
                    var buffer = track.arrayBuffer.buffer; //new Uint8Array(track.arrayBuffer.slice(0)).buffer;
                    this.props.loadUserAudio(trackIndex, buffer, track.offset);
                    asyncLoading = true;                 
                }            
            });
    
            if (asyncLoading === false) {
                // Если нет асинхронной загрузки пользовательского аудио, то скрываю индиктор загрузки
                this.props.setAppBusy(false);
            }
            
        }, 500)        
    }

    handlePrint = () => {
        console.log("print");
        this.props.printNotes();
    }
    
    handleExport = (onlySelection) => {
        console.log("export. onlySelection", onlySelection);
        this.props.exportAsWav(onlySelection);
    }

    handleBpmInputChange = (event) => {
        clearTimeout(this.bpmChangeTimerId);

        let value = event.target.value;
        value = value === '' ? "1" : value;

        var regNumber = /^[0-9\b]+$/;
        if (regNumber.test(value)){
            let intValue = parseInt(value);
            intValue = intValue < 1 ?  1 : intValue;
            intValue = intValue > 300 ? 300 : intValue;
            this.setState({ bpmDisplayValue: intValue });

            this.bpmChangeTimerId = setTimeout(() => {this.changeBpm(value)} , 1000);
        } 
    }

    changeBpm = (value) => {
        this.props.setBpm(value);
    }

    handleBooleanInputChange = (event) => {
        let name = event.target.name;
        let value = event.target.checked;

        switch(name) {
            case "realtimeRender":
                this.props.setRealtimeRender(value);
                break;
            case "playbackNotes":
                this.props.setPlaybackNotes(value);
                break;
            case "loop":
                this.props.setLoop(value);
                break;
            case "goToStartAfterStop":
                this.props.setGoToStartAfterStop(value);
                break;
            default:
                break;
        }
    }

    handleTimeSignatureChange = (event) => {   
        let value = [parseInt(event.target.value.split("/")[0]), parseInt(event.target.value.split("/")[1])]
        this.props.setTimeSignature(value); 
    }


    render() {
      console.log('Render Toolbar');
      return <div className="app-toolbar no-print">
                <IconButton onClick={this.handleLoad} disabled={!this.props.canLoad} icon={<OpenIcon />} title="Open project"/>
                <IconButton onClick={this.handleSave} disabled={!this.props.canSave} icon={<SaveIcon />} title="Save project"/>
                <div className="app-toolbar__delimiter"></div>

                <IconButton onClick={this.handlePrint} disabled={!this.props.canPrint} icon={<PrintIcon />}  title="Print sheet music"/>
                <ExportButton onClick={this.handleExport} disabled={!this.props.canExport}  title="Export as WAV"/>
                <div className="app-toolbar__delimiter"></div>

                
                <IconButton onClick={this.handlePlay} disabled={!this.props.canPlay} icon={<PlayIcon />} title="Play (Space)"/>
                <IconButton onClick={this.handlePause} disabled={!this.props.canPause} icon={<PauseIcon />} title="Pause (P)"/>
                <IconButton onClick={this.handleStop} disabled={!this.props.canStop} icon={<StopIcon />} title="Stop (S)"/>
                <div className="app-toolbar__delimiter"></div>

                
                <div className="app-toolbar__time-signature" >
                    <div className="app-toolbar__input-title">TIME SIG</div>
                    <Select value={this.timeSignatureString} onChange={this.handleTimeSignatureChange}>
                        {this.props.timeSignatures.map(ts => {
                            return <Option key={ts} content={ts} value={ts}></Option>
                        })}
                    </Select>
                </div>

                <div className="app-toolbar__bpm" >
                    <div className="app-toolbar__input-title">BPM</div>
                    <input name="bpm" value={this.getBpmDisplayValue} onChange={this.handleBpmInputChange} type="number"></input>
                </div>

                <div className="app-toolbar__time">
                    <div className="app-toolbar__input-title">TIME</div>
                    <div className="app-toolbar__time-input" ref={this.props.timeTextRef}>00:00:00.000</div>                    
                </div>
                <div className="app-toolbar__delimiter"></div>

                <div>
                    <SwitchButton name="goToStartAfterStop" onChange={this.handleBooleanInputChange} checked={this.props.goToStartAfterStop} icon={<RewindIcon />} title="Go to start after stop"/>
                </div>

                <div>
                    <SwitchButton name="loop" onChange={this.handleBooleanInputChange} checked={this.props.loop} icon={<LoopIcon />} title="Loop selected region"/>
                </div>

                <div>
                    <SwitchButton name="realtimeRender" onChange={this.handleBooleanInputChange} checked={this.props.realtimeRender} icon={<NoteIcon />} title="Show notation"/>
                </div>

                <div>
                    <SwitchButton name="playbackNotes" onChange={this.handleBooleanInputChange} checked={this.props.playbackNotes} icon={<PlayNoteIcon />} title="Playback notes"/>
                </div>

                <UserFileReader  ref={this.fileReaderRef} onFileLoaded={this.handleFileLoaded} readAsArrayBuffer accept=".beno"/>
        </div>
    }
}

const mapStateToProps = state => {
    const editor = state.editor;
    const appVersion = state.app.version;
    const canPlay = CanPlay(state);
    const canStop = CanStop(state);
    const canPause = CanPause(state);
    const canSave = CanSave(state);
    const canLoad = CanLoad(state);
    const canPrint = CanPrint(state);
    const canExport = CanExport(state);
    return {...editor, canPlay, canStop, canPause, canSave, canLoad, canPrint, canExport, appVersion};
}

export default connect(mapStateToProps, {setPlayerState, setRealtimeRender, setPlaybackNotes, setBpm, setTimeSignature, loadTracks, renderNotes, printNotes, loadUserAudio, exportAsWav, setAppBusy, setLoop, setGoToStartAfterStop}) (Toolbar)


class ExportButton extends React.Component {

    handleExportSelectionClick = () => {
        this.props.onClick && this.props.onClick(true);
    }

    handleExportWholeProjectClick = () => {
        this.props.onClick && this.props.onClick(false);
    }
  
    render() {
      const selectInput= <button className="app-toolbar__button no-margin" disabled={this.props.disabled} title={this.props.title}>Export as WAV</button>;
      return <div>
        <Select input={selectInput}>
            <Option key="export-whole-project" content="Export whole project" value="export-whole-project" onClick={this.handleExportWholeProjectClick}></Option>
            <Option key="export-selected-region" content="Export selected region" value="export-selected-region" onClick={this.handleExportSelectionClick}></Option>           
        </Select>
      </div>
    }

  }