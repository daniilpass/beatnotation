import React from "react";
import {connect} from "react-redux";

import {setPlayerState, setRealtimeRender, setPlaybackNotes, setBpm, setTimeSignature, loadTracks, 
    renderNotes, printNotes, loadUserAudio, exportAsWav, setAppBusy,
    setLoop} from "../../../redux/actions";
import {CanPlay, CanStop, CanPause, CanSave, CanLoad, CanPrint, CanExport} from "../../../redux/selectors";
import * as PlayerStates from "../../../redux/dictionary/playerStates";


import UserFileReader from "../../userFileReader/userFileReader";

import "./toolbar.css";
import {Select, Option} from "../../controls/select/select";

class Toolbar extends React.Component {
    constructor(props) {
      super(props)

      this.state = {
        tmpBpm: -1
      }
      this.bpmChangeTimerId = 0;
      this.fileReaderRef = React.createRef();  
    }

    get getBpm() {
        return this.state.tmpBpm > -1 ? this.state.tmpBpm : this.props.bpm;
    }

    shouldComponentUpdate (nextProps, nextState) {
        if (this.props.timeSignature !== nextProps.timeSignature
            || this.props.bpm !== nextProps.bpm
            || this.state.tmpBpm !== nextState.tmpBpm
            || this.props.canPlay !== nextProps.canPlay
            || this.props.canStop !== nextProps.canStop
            || this.props.canPause !== nextProps.canPause
            || this.props.canSave !== nextProps.canSave
            || this.props.canLoad !== nextProps.canLoad
            || this.props.canPrint !== nextProps.canPrint
            || this.props.realtimeRender !== nextProps.realtimeRender
            || this.props.playbackNotes !== nextProps.playbackNotes
            || this.props.loop !== nextProps.loop
            ) {
            return true;
        }
        
        return false;
    }
    
    componentDidMount () {
        // События дли отслеживания горячих клавиш -- Добавление
        document.addEventListener("keydown", this.handleKeyDown);
    }

    componentWillUnmount () {
        // События дли отслеживания горячих клавиш -- Удаление
        document.removeEventListener("keydown", this.handleKeyDown);
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
        //TODO: move to service
        console.log("save");
        
        //TODO: improve data to save (add app version)
        //console.log(this.props.tracks);
        let saveData = {
            bpm: this.props.bpm,
            timeSignature: this.props.timeSignature,
            tracks: [...this.props.tracks],     
        }

        //Save audio arrayBuffer to file
        saveData.tracks.forEach( (track, index) => {
            if (track.type === 0) {
                let tmpTrack = {...track};
                tmpTrack.arrayBuffer = Array.from(new Uint8Array(track.arrayBuffer));
                saveData.tracks[index] = tmpTrack;
            }
        });

        let content = JSON.stringify(saveData);
        let filename = "BeatNotation_"+Date.now()+".beno";
        const file = new Blob([content], {type: 'application/json'});

        const a = document.createElement('a');
        a.href= URL.createObjectURL(file);
        a.download = filename;
        a.click();
    
        URL.revokeObjectURL(a.href);
    }

    handleLoad = () => {
        console.log("load");
        this.fileReaderRef.current.selectFile();
    }

    handleFileLoaded = (content) => {
        //TODO: move to service
        console.log("loaded");
        let asyncLoading = false;
        this.props.setAppBusy(true, "Processing ...");
        setTimeout(() => {
            var data = JSON.parse(content);
            this.props.loadTracks(data);
            this.props.renderNotes();
    
            //load user audio files  
            //TODO: использовать асинхронно, когда появится поддержка нескольких дорожек      
            data.tracks.forEach((track, trackIndex) => {
                if (track.type === 0 && track.arrayBuffer && track.arrayBuffer.length > 0) {
                    var buffer = new Uint8Array(track.arrayBuffer.slice(0)).buffer;
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
            this.setState({
                tmpBpm: intValue
            });

            this.bpmChangeTimerId = setTimeout(() => {this.changeBpm(value)} , 1000);
        } 

        // if (value === null) {
        //     this.setState({
        //         tmpBpm: ""
        //     });
        // }
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
                <button className="app-toolbar__button" onClick={this.handlePlay} disabled={!this.props.canPlay}>Play</button>
                <button className="app-toolbar__button" onClick={this.handleStop} disabled={!this.props.canStop}>Stop</button>
                <button className="app-toolbar__button" onClick={this.handlePause} disabled={!this.props.canPause}>Pause</button>
                <button className="app-toolbar__button" onClick={this.handlePrint} disabled={!this.props.canPrint}>Print</button>
                <button className="app-toolbar__button" onClick={this.handleSave} disabled={!this.props.canSave}>Save</button>
                <button className="app-toolbar__button" onClick={this.handleLoad} disabled={!this.props.canLoad}>Load</button>
                <ExportButton onClick={this.handleExport} disabled={!this.props.canExport}/>

                {/* <div className="app-toolbar__part" >
                    Part: {Math.trunc(this.timelineNote) + 1 }
                </div> */}
                <div className="app-toolbar__time-signature" >
                    Time signature:
                    <Select value={this.timeSignatureString} onChange={this.handleTimeSignatureChange}>
                        {this.props.timeSignatures.map(ts => {
                            return <Option key={ts} content={ts} value={ts}></Option>
                        })}
                    </Select>
                </div>

                <div className="app-toolbar__bpm" >
                    BPM: 
                    <input name="bpm" value={this.getBpm} onChange={this.handleBpmInputChange} type="number"></input>
                </div>

                <div className="app-toolbar__time" ref={this.props.timeTextRef} >
                    00:00:00.000
                </div>

                <div>
                    Loop: 
                    <input name="loop" onChange={this.handleBooleanInputChange} checked={this.props.loop} type="checkbox"></input>
                </div>

                <div>
                    Show notation: 
                    <input name="realtimeRender" onChange={this.handleBooleanInputChange} checked={this.props.realtimeRender} type="checkbox"></input>
                </div>

                <div>
                    Playback notes: 
                    <input name="playbackNotes" onChange={this.handleBooleanInputChange} checked={this.props.playbackNotes} type="checkbox"></input>
                </div>

                <UserFileReader  ref={this.fileReaderRef} onFileLoaded={this.handleFileLoaded} accept=".beno"/>
        </div>
    }
}

const mapStateToProps = state => {
    const editor = state.editor;
    const canPlay = CanPlay(state);
    const canStop = CanStop(state);
    const canPause = CanPause(state);
    const canSave = CanSave(state);
    const canLoad = CanLoad(state);
    const canPrint = CanPrint(state);
    const canExport = CanExport(state);
    return {...editor, canPlay, canStop, canPause, canSave, canLoad, canPrint, canExport};
}

export default connect(mapStateToProps, {setPlayerState, setRealtimeRender, setPlaybackNotes, setBpm, setTimeSignature, loadTracks, renderNotes, printNotes, loadUserAudio, exportAsWav, setAppBusy, setLoop}) (Toolbar)


class ExportButton extends React.Component {

    handleExportSelectionClick = () => {
        this.props.onClick && this.props.onClick(true);
    }

    handleExportWholeProjectClick = () => {
        this.props.onClick && this.props.onClick(false);
    }
  
    render() {
      const selectInput= <button className="app-toolbar__button" disabled={this.props.disabled}>Export as WAV</button>;
      return <div>
        <Select input={selectInput}>
            <Option key="export-whole-project" content="Export whole project" value="export-whole-project" onClick={this.handleExportWholeProjectClick}></Option>
            <Option key="export-selected-region" content="Export selected region" value="export-selected-region" onClick={this.handleExportSelectionClick}></Option>           
        </Select>
      </div>
    }

  }