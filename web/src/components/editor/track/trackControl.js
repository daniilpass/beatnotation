import React from "react";
import MuteButton from "../../controls/muteButton/muteButton";


import {ReactComponent as OpenIcon} from "../../../assets/img/open-file.svg"

import  {ReactComponent as SettingsIcon}  from "../../../assets/img/settings.svg";
import { Option, Select } from "../../controls/select/select";
import IconButton from "../../controls/iconButton/iconButton";


class TrackControl extends React.Component {
    constructor(props) {
      super(props);  
      
      this.drag = {
        //oldClientX: -1,
        oldClientY: -1
      }

      this.state = {
        tmpVolume: -1
      }

      this.tcVolume = React.createRef();
    }

    get Title(){
      return this.props.track.title;
    }

    get Volume() {
      return Math.trunc(this.state.tmpVolume > -1 ? this.state.tmpVolume : this.props.track.volume * 100);
    }

    get maxVolume() {
      return this.props.maxVolume || 100;
    }

    get isMuted() {
      return this.props.track.isMute;
    }

    componentDidMount() {
      this.tcVolume.current.onmousedown = this.dragMouseDown;
    }

    shouldComponentUpdate(prevPros, prevState) {
      // console.log('shouldComponentUpdate', this.props, prevPros);
      if (this.props.track.volume !== prevPros.track.volume
        || this.state.tmpVolume !== prevState.tmpVolume
        || this.props.track.isMute !== prevPros.track.isMute
        || this.props.canImportAudio !== prevPros.canImportAudio) {
        return true;
      }

      return false;
    }

    dragMouseDown = (e) => {
      e.preventDefault();

      this.setState({tmpVolume: this.props.track.volume * 100})
      //this.drag.oldClientX = e.clientX;
      this.drag.oldClientY = e.clientY;

      document.onmouseup = this.closeDragElement;
      document.onmousemove = this.dragVolume;
    }

    closeDragElement = (e) => {
      e.preventDefault();
      document.onmouseup = null;
      document.onmousemove = null;
      this.props.onVolumeChange && this.props.onVolumeChange(this.state.tmpVolume / 100);
      this.setState({tmpVolume: -1})
    }

    dragVolume = (e) => {
      e.preventDefault();

      //Cala delta
      //let deltaX = (this.drag.oldClientX - e.clientX);
      let deltaY = (this.drag.oldClientY - e.clientY)
      //Save new values as old
      //this.drag.oldClientX = e.clientX;
      this.drag.oldClientY = e.clientY;
      //change volume
      let newVolume = this.state.tmpVolume + deltaY;
      if (newVolume <= this.maxVolume && newVolume >= 0) {
        window.requestAnimationFrame( () => { this.setState({tmpVolume: newVolume}) } );
      }
      //console.log(deltaX, deltaY, this.tmpVolume);
    }

    onLoadClick = () => {
      this.props.onLoadClick();
    }

    handleTrackIsMuteClick = () => {
      this.props.onTrackIsMute();
    }

    render() {  
      //console.log("Render TrackControl");
      return <div className="track-control" style={{width: this.props.width, height: this.props.height}}>
          <div className="track-control__volume"  ref={this.tcVolume} style={{background: `linear-gradient(to top, rgb(13 136 0 / 52%) ${this.Volume/(this.maxVolume/100)}%, transparent 0% )`}}>
            {this.Volume}
          </div>
          <div className="track-control__title" style={{lineHeight: this.props.height-2+"px"}}>{this.Title}</div>
          <TrackSettingsButton showImportOption={this.props.track.type === 0} canImportAudio={this.props.canImportAudio} onClearTrack={this.props.onClearTrack} onImportAudio={this.props.onLoadClick}/>
          <MuteButton onClick={this.handleTrackIsMuteClick} isMuted={this.isMuted}/>
          {this.props.track.type === 0 && <IconButton className="track-control__load" onClick={this.onLoadClick} disabled={!this.props.canImportAudio} icon={<OpenIcon/>} title="Import audio file"/>}
      </div>
    }
  }

  export default TrackControl;


  class TrackSettingsButton extends React.Component {

    shouldComponentUpdate(nextProps) {
      if (this.props.showImportOption !== nextProps.showImportOption
          || (nextProps.showImportOption === true && this.props.canImportAudio !== nextProps.canImportAudio) ) {
            return true;
      }

      return false;
    }

    handleImportAudio = () => {
      this.props.canImportAudio && this.props.onImportAudio && this.props.onImportAudio();
    }

    handleClearTrack = () => {
      this.props.onClearTrack && this.props.onClearTrack();
    }

    render() {
      console.log("RENDER SETTINGS")
      const selectInput=<SettingsIcon className="settings-icon"/>;
      return <div className="track-control__settings">
        <Select input={selectInput}>
          {this.props.showImportOption  &&
            <Option key="import-audio" content="Import audio file" value="import-audio" onClick={this.handleImportAudio} disabled={!this.props.canImportAudio}></Option>
          }
          <Option key="clear-track" content="Clear track" value="Clear-track" onClick={this.handleClearTrack}></Option>
        </Select>
      </div>
    }

  }