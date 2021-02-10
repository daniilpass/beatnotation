import React from "react";
import {connect} from "react-redux";

import {setPlayerState, setRealtimeRender, setPlaybackNotes, setBpm, setTimeSignature, loadTracks, renderNotes, printNotes, loadUserAudio, exportAsWav, setAppBusy} from "../../../redux/actions";
import {CanPlay, CanStop, CanPause, CanSave, CanLoad, CanPrint, CanExport} from "../../../redux/selectors";
import * as PlayerStates from "../../../redux/dictionary/playerStates";


import UserFileReader from "../../userFileReader/userFileReader";

import "./toolbar.css";

class Toolbar extends React.Component {
    constructor(props) {
      super(props)

      this.state = {

      }
          
      this.fileReaderRef = React.createRef();  
    }

    shouldComponentUpdate (nextProps) {
        if (this.props.timeSignature !== nextProps.timeSignature
            || this.props.bpm !== nextProps.bpm
            || this.props.canPlay !== nextProps.canPlay
            || this.props.canStop !== nextProps.canStop
            || this.props.canPause !== nextProps.canPause
            || this.props.canSave !== nextProps.canSave
            || this.props.canLoad !== nextProps.canLoad
            || this.props.canPrint !== nextProps.canPrint
            || this.props.realtimeRender !== nextProps.realtimeRender
            || this.props.playbackNotes !== nextProps.playbackNotes
            ) {
            return true;
        }
        
        return false;
    }
    
    componentDidMount () {
        document.addEventListener("keyup", this.handleKeyDown);
    }

    componentWillUnmount () {
        document.removeEventListener("keyup", this.handleKeyDown);
    }

    get timeSignatureString() {
        return this.props.timeSignature[0]+"/"+this.props.timeSignature[1];
    }

    handleKeyDown= (e) => {
        e.preventDefault();
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
            break;
        }
        return false;
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
    
    handleExport = () => {
        console.log("export");
        this.props.exportAsWav();
    }

    handleBpmInputChange = (event) => {
        let value = event.target.value;
        value = value === '' ? '1' : value;

        var regNumber = /^[0-9\b]+$/;
        if (regNumber.test(value)){
            let intValue = parseInt(value);
            intValue = intValue < 1 ?  1 : intValue;
            intValue = intValue > 300 ? 300 : intValue;
            this.props.setBpm(intValue);
        }  
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
                <button className="app-toolbar__button" onClick={this.handleExport} disabled={!this.props.canExport}>Export as WAV</button>

                {/* <div className="app-toolbar__part" >
                    Part: {Math.trunc(this.timelineNote) + 1 }
                </div> */}
                <div className="app-toolbar__bpm" >
                    Time signature: 
                    <select name='timeSignature' value={this.timeSignatureString} onChange={this.handleTimeSignatureChange}>
                    {this.props.timeSignatures.map(ts => {
                        return <option key={ts} value={ts}>{ts}</option>
                    })}
                    </select>
                </div>

                <div className="app-toolbar__bpm" >
                    BPM: 
                    <input name="bpm" value={this.props.bpm} onChange={this.handleBpmInputChange} type="number"></input>
                </div>

                <div className="app-toolbar__time" ref={this.props.timeTextRef} >
                    00:00:00.000
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

export default connect(mapStateToProps, {setPlayerState, setRealtimeRender, setPlaybackNotes, setBpm, setTimeSignature, loadTracks, renderNotes, printNotes, loadUserAudio, exportAsWav, setAppBusy}) (Toolbar)